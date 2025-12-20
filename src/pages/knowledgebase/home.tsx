import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingUp, Bell, Folder, ChevronRight } from "lucide-react";
import {
  KnowledgebaseCard,
  KnowledgebaseSearchBar,
} from "../../components/knowledgebase";
import { useKnowledgebaseContext } from "../../context/KnowledgebaseContext";
import type { KnowledgebaseWithNotes } from "../../types/knowledgebase";

// =============================================================================
// Knowledgebase Home Page Content
// =============================================================================

export default function KnowledgebaseHome() {
  const navigate = useNavigate();
  const {
    homeData,
    searchResults,
    isLoading,
    fetchHomeData,
    search,
    setSearchResults,
  } = useKnowledgebaseContext();

  const [isSearching, setIsSearching] = useState(false);

  // Fetch home data on mount
  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const handleSearch = useCallback(
    async (query: string, filter: "all" | "knowledgebases" | "notes") => {
      setIsSearching(true);
      await search({ query, filter });
      setIsSearching(false);
    },
    [search]
  );

  const handleClearSearch = () => {
    setSearchResults(null);
  };

  const handleKnowledgebaseClick = (id: number) => {
    navigate(`/knowledgebase/${id}`);
  };

  const handleCreateNew = () => {
    navigate("/knowledgebase/create");
  };

  const handleManage = (id: number) => {
    navigate(`/knowledgebase/${id}/edit`);
  };

  // Loading state
  if (isLoading && !homeData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6 pb-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between animate-fade-in">
          <h1 className="text-xl font-bold text-default">Knowledgebase</h1>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-default rounded-lg font-medium hover:bg-secondary/80 transition-colors"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Create New</span>
          </button>
        </div>

        {/* Search Bar */}
        <section className="animate-fade-in animation-delay-100">
          <KnowledgebaseSearchBar
            onSearch={handleSearch}
            isLoading={isSearching}
          />
        </section>

        {/* Search Results */}
        {searchResults && (
          <section className="bg-secondary rounded-xl p-4 sm:p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-default">Search Results</h2>
              <button
                onClick={handleClearSearch}
                className="text-accent text-caption hover:underline"
              >
                Clear search
              </button>
            </div>

            {searchResults.knowledgebases.length === 0 && searchResults.notes.length === 0 ? (
              <p className="text-default/50 text-center py-8">No results found</p>
            ) : (
              <div className="space-y-6">
                {searchResults.knowledgebases.length > 0 && (
                  <div>
                    <h3 className="text-default/60 text-caption font-medium mb-3">
                      Knowledgebases ({searchResults.knowledgebases.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.knowledgebases.map((kb) => (
                        <KnowledgebaseCard
                          key={kb.id}
                          knowledgebase={kb}
                          onClick={() => handleKnowledgebaseClick(kb.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.notes.length > 0 && (
                  <div>
                    <h3 className="text-default/60 text-caption font-medium mb-3">
                      Notes ({searchResults.notes.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults.notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-primary rounded-lg p-3 cursor-pointer hover:ring-1 hover:ring-accent/30 transition-all"
                        >
                          <h4 className="font-medium text-default">{note.title || "Untitled"}</h4>
                          <p className="text-default/50 text-caption line-clamp-1 mt-1">
                            {note.body?.replace(/<[^>]*>/g, "").slice(0, 100) || "No content"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Featured Knowledgebases */}
        {!searchResults && homeData?.featured && homeData.featured.length > 0 && (
          <section className="animate-fade-in-up animation-delay-200">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-accent" />
              <h2 className="text-lg font-semibold text-default">Featured</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeData.featured.map((kb) => (
                <KnowledgebaseCard
                  key={kb.id}
                  knowledgebase={kb}
                  onClick={() => handleKnowledgebaseClick(kb.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Subscribed Updates */}
        {!searchResults && homeData?.subscribed && homeData.subscribed.length > 0 && (
          <section className="animate-fade-in-up animation-delay-300">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="size-5 text-accent" />
              <h2 className="text-lg font-semibold text-default">Updates from Subscriptions</h2>
            </div>
            <div className="space-y-4">
              {homeData.subscribed.map((kb: KnowledgebaseWithNotes) => (
                <div key={kb.id} className="bg-secondary/50 rounded-xl p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleKnowledgebaseClick(kb.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                        {kb.image_url ? (
                          <img src={kb.image_url} alt={kb.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-accent font-bold">
                            {kb.name?.charAt(0)?.toUpperCase() || "K"}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-default">{kb.name || "Untitled"}</h3>
                        <p className="text-default/50 text-caption">
                          {kb.latest_notes?.length || 0} new notes
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-default/40" />
                  </div>

                  {kb.latest_notes && kb.latest_notes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-default/10 space-y-2">
                      {kb.latest_notes.slice(0, 3).map((note) => (
                        <div
                          key={note.id}
                          className="bg-primary rounded-lg p-3 cursor-pointer hover:ring-1 hover:ring-accent/20 transition-all"
                        >
                          <h4 className="text-default text-body font-medium truncate">
                            {note.title || "Untitled"}
                          </h4>
                        </div>
                      ))}
                      {kb.latest_notes.length > 3 && (
                        <button className="text-accent text-caption hover:underline">
                          Show more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Knowledgebases */}
        {!searchResults && homeData?.myKnowledgebases && homeData.myKnowledgebases.length > 0 && (
          <section className="animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2 mb-4">
              <Folder className="size-5 text-accent" />
              <h2 className="text-lg font-semibold text-default">My Knowledgebases</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeData.myKnowledgebases.map((kb) => (
                <KnowledgebaseCard
                  key={kb.id}
                  knowledgebase={kb}
                  onClick={() => handleKnowledgebaseClick(kb.id)}
                  showActions
                  isManaged
                  onManage={() => handleManage(kb.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!searchResults &&
          !homeData?.featured?.length &&
          !homeData?.subscribed?.length &&
          !homeData?.myKnowledgebases?.length && (
            <div className="text-center py-16">
              <Folder className="size-16 text-default/20 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-default mb-2">No knowledgebases yet</h2>
              <p className="text-default/50 mb-6">
                Create your first knowledgebase to start organizing your notes
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-default rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                <Plus className="size-5" />
                Create Knowledgebase
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
