import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Search, BookOpen, X } from "lucide-react";
import { useDefinitions } from "@/hooks/use-definitions";
import {
  definitions,
  definitionCategories,
  searchDefinitions,
  getDefinition,
  getDefinitionsByCategory,
  type DefinitionTerm,
  type DefinitionCategory,
} from "@/data/definitions";
import { trackEvent } from "@/lib/analytics";

export function DefinitionsDrawer() {
  const { isOpen, focusedTerm, closeDefinitions, openDefinitions } = useDefinitions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DefinitionCategory | null>(null);
  const [viewingTerm, setViewingTerm] = useState<DefinitionTerm | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && focusedTerm) {
      const term = getDefinition(focusedTerm);
      if (term) {
        setViewingTerm(term);
        setSearchQuery("");
        setSelectedCategory(null);
        trackEvent("definition_viewed", "definitions", focusedTerm);
      }
    } else if (isOpen && !focusedTerm) {
      setViewingTerm(null);
      setSearchQuery("");
      setSelectedCategory(null);
      setTimeout(() => searchRef.current?.focus(), 200);
    }
  }, [isOpen, focusedTerm]);

  const handleClose = useCallback(() => {
    closeDefinitions();
    setViewingTerm(null);
    setSearchQuery("");
    setSelectedCategory(null);
  }, [closeDefinitions]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.length > 0 && value.length % 3 === 0) {
      trackEvent("definitions_search_used", "definitions", undefined, value.length);
    }
  }, []);

  const handleSelectTerm = useCallback((term: DefinitionTerm) => {
    setViewingTerm(term);
    trackEvent("definition_viewed", "definitions", term.id);
  }, []);

  const handleBack = useCallback(() => {
    setViewingTerm(null);
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const handleRelatedTermClick = useCallback((slug: string) => {
    const term = getDefinition(slug);
    if (term) {
      setViewingTerm(term);
      trackEvent("definition_viewed", "definitions", slug);
    }
  }, []);

  let filteredTerms: DefinitionTerm[];
  if (searchQuery.trim()) {
    filteredTerms = searchDefinitions(searchQuery);
    if (selectedCategory) {
      filteredTerms = filteredTerms.filter((t) => t.category === selectedCategory);
    }
  } else if (selectedCategory) {
    filteredTerms = getDefinitionsByCategory(selectedCategory);
  } else {
    filteredTerms = definitions;
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        aria-label="Definitions reference"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <SheetTitle className="text-lg font-heading">Definitions</SheetTitle>
          </div>
          <SheetDescription className="text-sm text-muted-foreground">
            Quick reference for home maintenance terms
          </SheetDescription>
        </SheetHeader>

        {viewingTerm ? (
          <div className="flex-1 overflow-auto">
            <div className="px-6 py-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
                data-testid="button-definitions-back"
              >
                <ArrowLeft className="h-4 w-4" />
                All terms
              </Button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <Badge variant="secondary" className="mb-2 text-xs">
                  {viewingTerm.category}
                </Badge>
                <h3 className="text-xl font-heading font-semibold text-foreground">
                  {viewingTerm.title}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {viewingTerm.longDefinition}
              </p>

              {viewingTerm.examples && viewingTerm.examples.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Examples</h4>
                  <ul className="space-y-1.5">
                    {viewingTerm.examples.map((ex, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary"
                      >
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingTerm.relatedTerms.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Related Terms</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingTerm.relatedTerms.map((slug) => {
                      const related = getDefinition(slug);
                      if (!related) return null;
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => handleRelatedTermClick(slug)}
                          className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                          data-testid={`related-term-${slug}`}
                        >
                          {related.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 space-y-3 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search terms..."
                  className="pl-9 pr-8 h-10"
                  data-testid="input-definitions-search"
                  aria-label="Search definitions"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <div className="flex gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`whitespace-nowrap text-xs px-2.5 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                      !selectedCategory
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                    data-testid="filter-category-all"
                  >
                    All
                  </button>
                  {definitionCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                      className={`whitespace-nowrap text-xs px-2.5 py-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                      data-testid={`filter-category-${cat.toLowerCase()}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-4 py-2">
                {filteredTerms.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No terms found for "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredTerms.map((term) => (
                      <button
                        key={term.id}
                        type="button"
                        onClick={() => handleSelectTerm(term)}
                        className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring group"
                        data-testid={`definition-item-${term.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {term.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                              {term.shortDefinition}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                            {term.category}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
