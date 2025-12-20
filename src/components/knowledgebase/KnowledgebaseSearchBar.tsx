import { useState, useCallback, type FC } from "react";
import { Search, Filter, X } from "lucide-react";

// =============================================================================
// KnowledgebaseSearchBar - Search bar with filter options
// =============================================================================

type FilterType = "all" | "knowledgebases" | "notes";

interface KnowledgebaseSearchBarProps {
  onSearch: (query: string, filter: FilterType) => void;
  placeholder?: string;
  initialFilter?: FilterType;
  isLoading?: boolean;
}

export const KnowledgebaseSearchBar: FC<KnowledgebaseSearchBarProps> = ({
  onSearch,
  placeholder = "Search knowledgebases and notes...",
  initialFilter = "all",
  isLoading = false,
}) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim(), filter);
    }
  }, [query, filter, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "knowledgebases", label: "Knowledgebases" },
    { value: "notes", label: "Notes" },
  ];

  return (
    <div className="w-full">
      <div className="relative flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-default/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 bg-secondary rounded-md text-default placeholder:text-default/40 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-primary/50 text-default/40 hover:text-default transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-md transition-colors ${
            showFilters ? "bg-accent text-primary" : "bg-secondary text-default/60 hover:text-default"
          }`}
        >
          <Filter className="size-4" />
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
          className="px-6 py-3 button rounded-md font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-default/60 text-caption">Filter by:</span>
          <div className="flex gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-1.5 rounded-full text-caption font-medium transition-colors ${
                  filter === option.value
                    ? "bg-accent text-primary"
                    : "bg-secondary text-default/60 hover:text-default"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
