/// <reference types="@types/google.maps" />
import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, AlertCircle, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddressComponents {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  zipPlus4?: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, components?: AddressComponents) => void;
  onVerified?: (verified: boolean, components?: AddressComponents) => void;
  placeholder?: string;
  className?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

declare global {
  interface Window {
    google?: typeof google;
    initGooglePlaces?: () => void;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onVerified,
  placeholder = "Enter your home address...",
  className,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "verified" | "failed">("idle");
  const [verifiedAddress, setVerifiedAddress] = useState<AddressComponents | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn("Google Places API key not configured");
      return;
    }

    if (window.google?.maps?.places) {
      initializeServices();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    
    window.initGooglePlaces = () => {
      initializeServices();
    };
    
    document.head.appendChild(script);

    return () => {
      if (window.initGooglePlaces) {
        delete window.initGooglePlaces;
      }
    };
  }, []);

  const initializeServices = () => {
    if (window.google?.maps?.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
      setGoogleLoaded(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const results = await new Promise<PlacePrediction[]>((resolve, reject) => {
        autocompleteService.current!.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: "us" },
            types: ["address"],
          },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              resolve(predictions as PlacePrediction[]);
            } else {
              resolve([]);
            }
          }
        );
      });
      
      setPredictions(results);
      setShowDropdown(results.length > 0);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        fetchPredictions(inputValue);
        setVerificationStatus("idle");
        setVerifiedAddress(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, fetchPredictions, value]);

  const selectPrediction = async (prediction: PlacePrediction) => {
    if (!placesService.current) return;

    setInputValue(prediction.description);
    setPredictions([]);
    setShowDropdown(false);
    setIsLoading(true);

    try {
      const placeDetails = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.current!.getDetails(
          {
            placeId: prediction.place_id,
            fields: ["address_components", "formatted_address"],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error("Failed to get place details"));
            }
          }
        );
      });

      const components = parseAddressComponents(placeDetails.address_components || []);
      components.fullAddress = prediction.description;
      
      onChange(prediction.description, components);
      
      await verifyWithUSPS(components);
    } catch (error) {
      console.error("Error getting place details:", error);
      onChange(prediction.description);
    } finally {
      setIsLoading(false);
    }
  };

  const parseAddressComponents = (
    components: google.maps.GeocoderAddressComponent[]
  ): AddressComponents => {
    const result: AddressComponents = {
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      fullAddress: "",
    };

    let streetNumber = "";
    let route = "";

    for (const component of components) {
      const types = component.types;

      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      }
      if (types.includes("route")) {
        route = component.long_name;
      }
      if (types.includes("locality")) {
        result.city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        result.state = component.short_name;
      }
      if (types.includes("postal_code")) {
        result.zipCode = component.long_name;
      }
      if (types.includes("postal_code_suffix")) {
        result.zipPlus4 = component.long_name;
      }
    }

    result.streetAddress = `${streetNumber} ${route}`.trim();
    return result;
  };

  const verifyWithUSPS = async (components: AddressComponents) => {
    setVerificationStatus("verifying");

    try {
      const response = await fetch("/api/address/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          streetAddress: components.streetAddress,
          city: components.city,
          state: components.state,
          zipCode: components.zipCode,
        }),
      });

      const data = await response.json();

      if (data.verified && data.address) {
        const verified: AddressComponents = {
          streetAddress: data.address.streetAddress,
          city: data.address.city,
          state: data.address.state,
          zipCode: data.address.zipCode,
          zipPlus4: data.address.zipPlus4,
          fullAddress: `${data.address.streetAddress}, ${data.address.city}, ${data.address.state} ${data.address.zipCode}`,
        };
        setVerifiedAddress(verified);
        setVerificationStatus("verified");
        onVerified?.(true, verified);
      } else {
        setVerificationStatus("failed");
        onVerified?.(false);
      }
    } catch (error) {
      console.error("USPS verification error:", error);
      setVerificationStatus("idle");
    }
  };

  const handleManualVerify = async () => {
    const parts = inputValue.split(",").map(s => s.trim());
    if (parts.length >= 3) {
      const components: AddressComponents = {
        streetAddress: parts[0],
        city: parts[1],
        state: parts[2].split(" ")[0],
        zipCode: parts[2].split(" ")[1] || "",
        fullAddress: inputValue,
      };
      onChange(inputValue, components);
      await verifyWithUSPS(components);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={cn("pl-9 h-12 text-lg pr-24", 
            verificationStatus === "verified" && "border-green-500 focus-visible:ring-green-500"
          )}
          data-testid="input-address"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {verificationStatus === "verifying" && (
            <Badge variant="secondary" className="text-xs">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Verifying
            </Badge>
          )}
          {verificationStatus === "verified" && (
            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              USPS Verified
            </Badge>
          )}
          {verificationStatus === "failed" && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Verified
            </Badge>
          )}
        </div>
      </div>

      {showDropdown && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-64 overflow-auto"
        >
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b last:border-b-0"
              onClick={() => selectPrediction(prediction)}
              data-testid={`address-suggestion-${prediction.place_id}`}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div>
                <div className="font-medium text-sm">{prediction.structured_formatting.main_text}</div>
                <div className="text-xs text-muted-foreground">{prediction.structured_formatting.secondary_text}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!googleLoaded && inputValue.length > 0 && (
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualVerify}
            disabled={verificationStatus === "verifying"}
            data-testid="button-verify-address"
          >
            {verificationStatus === "verifying" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            Verify with USPS
          </Button>
        </div>
      )}

      {verifiedAddress && verificationStatus === "verified" && (
        <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
          <div className="font-medium text-green-800 flex items-center gap-1 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            USPS Standardized Address
          </div>
          <div className="text-green-700">
            {verifiedAddress.streetAddress}<br />
            {verifiedAddress.city}, {verifiedAddress.state} {verifiedAddress.zipCode}
            {verifiedAddress.zipPlus4 && `-${verifiedAddress.zipPlus4}`}
          </div>
        </div>
      )}
    </div>
  );
}
