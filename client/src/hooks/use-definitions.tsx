import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface DefinitionsContextValue {
  isOpen: boolean;
  focusedTerm: string | null;
  openDefinitions: (termSlug?: string) => void;
  closeDefinitions: () => void;
}

const DefinitionsContext = createContext<DefinitionsContextValue | null>(null);

export function DefinitionsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedTerm, setFocusedTerm] = useState<string | null>(null);

  const openDefinitions = useCallback((termSlug?: string) => {
    setFocusedTerm(termSlug ?? null);
    setIsOpen(true);
  }, []);

  const closeDefinitions = useCallback(() => {
    setIsOpen(false);
    setFocusedTerm(null);
  }, []);

  return (
    <DefinitionsContext.Provider value={{ isOpen, focusedTerm, openDefinitions, closeDefinitions }}>
      {children}
    </DefinitionsContext.Provider>
  );
}

export function useDefinitions() {
  const ctx = useContext(DefinitionsContext);
  if (!ctx) throw new Error("useDefinitions must be used within DefinitionsProvider");
  return ctx;
}
