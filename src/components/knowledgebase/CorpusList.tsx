import { useEffect, type FC } from "react";
import { useKnowledgebaseContext } from "../../context/KnowledgebaseContext";
import {
  Heart,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Plus,
  FileText,
} from "lucide-react";
import type { Corpus, CorpusListProps } from "../../types/corpus";

// =============================================================================
// Corpus List Component
// =============================================================================

export const CorpusList: FC<CorpusListProps> = ({
  knowledgebaseId,
  showDrafts = false,
  showActions = false,
  onCorpusClick,
  onEditClick,
  onDeleteClick,
  className = "",
}) => {
  const {
    corpusList,
    isCorpusLoading,
    corpusError,
    fetchKnowledgebaseCorpus,
    openCorpusViewer,
    openCorpusEditor,
    deleteCorpus,
    isLiked,
  } = useKnowledgebaseContext();

  // Fetch corpus when knowledgebaseId changes
  useEffect(() => {
    if (knowledgebaseId) {
      fetchKnowledgebaseCorpus(knowledgebaseId, showDrafts);
    }
  }, [knowledgebaseId, showDrafts, fetchKnowledgebaseCorpus]);

  // Handle corpus click
  const handleCorpusClick = (corpus: Corpus) => {
    if (onCorpusClick) {
      onCorpusClick(corpus);
    } else {
      openCorpusViewer(corpus);
    }
  };

  // Handle edit click
  const handleEditClick = (e: React.MouseEvent, corpus: Corpus) => {
    e.stopPropagation();
    if (onEditClick) {
      onEditClick(corpus);
    } else {
      openCorpusEditor(corpus);
    }
  };

  // Handle delete click
  const handleDeleteClick = async (e: React.MouseEvent, corpus: Corpus) => {
    e.stopPropagation();
    if (onDeleteClick) {
      onDeleteClick(corpus);
    } else {
      if (window.confirm("Are you sure you want to delete this corpus?")) {
        await deleteCorpus(corpus.id);
        // Refresh the list
        fetchKnowledgebaseCorpus(knowledgebaseId, showDrafts);
      }
    }
  };

  // Handle create new corpus
  const handleCreateClick = () => {
    openCorpusEditor();
  };

  // Strip HTML for preview
  const getTextPreview = (html: string | null, maxLength: number = 150) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body.textContent || "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Loading state
  if (isCorpusLoading) {
    return (
      <div className={`bg-secondary rounded-lg p-4 ${className}`}>
        <h3 className="font-semibold text-default mb-4">Corpus</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-primary rounded-lg p-4">
              <div className="h-4 bg-default/10 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-default/10 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-default/10 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (corpusError) {
    return (
      <div className={`bg-secondary rounded-lg p-4 ${className}`}>
        <p className="text-red-400 text-center py-4">{corpusError}</p>
        <button
          onClick={() => fetchKnowledgebaseCorpus(knowledgebaseId, showDrafts)}
          className="block mx-auto px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (corpusList.length === 0) {
    return (
      <div className={`bg-secondary rounded-lg p-4 ${className}`}>
        <div className="text-center py-8">
          <FileText className="size-12 text-default/20 mx-auto mb-3" />
          <p className="text-default/40 text-body">
            {showDrafts
              ? "No corpus items have been created yet"
              : "No published corpus items available"}
          </p>
          {showActions && (
            <button
              onClick={handleCreateClick}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
            >
              <Plus className="size-4" />
              Create Corpus
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={` p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-default">Corpus ({corpusList.length})</h3>
        {showActions && (
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent/80 transition-colors"
          >
            <Plus className="size-4" />
            Create
          </button>
        )}
      </div>

      <div className="space-y-3">
        {corpusList.map((corpus) => (
          <div
            key={corpus.id}
            className="group p-4  transition-all cursor-pointer"
            onClick={() => handleCorpusClick(corpus)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Title & Status */}
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-default text-body truncate">
                    {corpus.title || "Untitled Corpus"}
                  </h4>
                  {corpus.is_approved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                      <CheckCircle className="size-3" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-default/10 text-default/60 text-xs rounded-full">
                      <Clock className="size-3" />
                      Draft
                    </span>
                  )}
                </div>

                {/* Body Preview */}
                <p className="text-default/50 text-caption line-clamp-2 mt-1">
                  {getTextPreview(corpus.body)}
                </p>

                {/* Keywords */}
                {corpus.keywords && corpus.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {corpus.keywords.slice(0, 3).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-default/10 text-default/60 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                    {corpus.keywords.length > 3 && (
                      <span className="px-2 py-0.5 bg-default/10 text-default/60 text-xs rounded">
                        +{corpus.keywords.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-default/40 text-xs">
                  <span className="flex items-center gap-1">
                    <Heart
                      className={`size-3.5 ${
                        isLiked(corpus) ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    {corpus.liked_users_ids?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3.5" />
                    {corpus.comments?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    View
                  </span>
                </div>
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditClick(e, corpus)}
                    className="p-2 text-default/40 hover:text-accent hover:bg-secondary rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, corpus)}
                    className="p-2 text-default/40 hover:text-red-400 hover:bg-secondary rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CorpusList;
