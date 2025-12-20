import { useState, useEffect, type FC } from "react";
import { useKnowledgebaseContext } from "../../context/KnowledgebaseContext";
import {
  Heart,
  MessageSquare,
  BookmarkPlus,
  CheckCircle,
  Clock,
  Send,
  Trash2,
  X,
  ArrowLeft,
  Share2,
} from "lucide-react";
import type { CorpusComment } from "../../types/corpus";
import { GlobalDialog } from "../ui/GlobalDialog";

// =============================================================================
// Corpus Viewer Component - Full-screen Medium-style reading experience
// =============================================================================

export const CorpusViewer: FC = () => {
  const {
    viewedCorpus,
    isCorpusViewerOpen,
    closeCorpusViewer,
    likeCorpus,
    unlikeCorpus,
    addComment,
    deleteComment,
    saveCorpusToNotes,
    isLiked,
    isCorpusLoading,
  } = useKnowledgebaseContext();

  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setScrolled(target.scrollTop > 100);
    };

    const scrollContainer = document.getElementById("corpus-viewer-scroll");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [isCorpusViewerOpen]);

  // Lock body scroll when viewer is open
  useEffect(() => {
    if (isCorpusViewerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCorpusViewerOpen]);

  if (!isCorpusViewerOpen || !viewedCorpus) return null;

  const liked = isLiked(viewedCorpus);
  const likeCount = viewedCorpus.liked_users_ids?.length || 0;
  const comments = viewedCorpus.comments || [];

  // Handle like toggle
  const handleLikeToggle = async () => {
    if (liked) {
      await unlikeCorpus(viewedCorpus.id);
    } else {
      await likeCorpus(viewedCorpus.id);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(viewedCorpus.id, newComment.trim());
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await deleteComment(viewedCorpus.id, commentId);
    }
  };

  // Handle save to notes
  const handleSaveToNotes = async () => {
    const note = await saveCorpusToNotes(viewedCorpus.id);
    if (note) {
      setSuccessMessage("Corpus saved to your personal notes!");
    }
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: viewedCorpus.title || "Shared from Cogniva",
          text: viewedCorpus.title || "",
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSuccessMessage("Link copied to clipboard!");
    }
  };

  // Estimate reading time (average 200 words per minute)
  const estimateReadingTime = () => {
    const text = viewedCorpus.body?.replace(/<[^>]*>/g, "") || "";
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(wordCount / 200);
    return minutes < 1 ? "1 min read" : `${minutes} min read`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-secondary animate-fade-in">
      {/* Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
          scrolled
            ? "bg-secondary/95 backdrop-blur-md border-b border-default/10 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button
              onClick={closeCorpusViewer}
              className="inline-flex items-center gap-2 text-default/60 hover:text-default transition-colors"
            >
              <ArrowLeft className="size-5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Title (shows when scrolled) */}
            <h1
              className={`font-medium text-default truncate max-w-md transition-opacity duration-300 ${
                scrolled ? "opacity-100" : "opacity-0"
              }`}
            >
              {viewedCorpus.title || "Untitled"}
            </h1>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleLikeToggle}
                disabled={isCorpusLoading}
                className={`p-2 rounded-full transition-colors ${
                  liked
                    ? "text-red-400 bg-red-500/10"
                    : "text-default/40 hover:text-default hover:bg-default/10"
                }`}
                title={liked ? "Unlike" : "Like"}
              >
                <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className={`p-2 rounded-full transition-colors ${
                  showComments
                    ? "text-accent bg-accent/10"
                    : "text-default/40 hover:text-default hover:bg-default/10"
                }`}
                title="Comments"
              >
                <MessageSquare className="size-5" />
                {comments.length > 0 && (
                  <span className="sr-only">{comments.length} comments</span>
                )}
              </button>
              <button
                onClick={handleSaveToNotes}
                disabled={isCorpusLoading}
                className="p-2 rounded-full text-default/40 hover:text-default hover:bg-default/10 transition-colors"
                title="Save to Notes"
              >
                <BookmarkPlus className="size-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-default/40 hover:text-default hover:bg-default/10 transition-colors"
                title="Share"
              >
                <Share2 className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        id="corpus-viewer-scroll"
        className="h-full overflow-y-auto pt-16"
      >
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Article Header */}
          <header className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-default leading-tight mb-6">
              {viewedCorpus.title || "Untitled"}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-default/50">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" />
                {estimateReadingTime()}
              </span>
              
              {viewedCorpus.is_approved ? (
                <span className="inline-flex items-center gap-1 text-green-400">
                  <CheckCircle className="size-4" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <Clock className="size-4" />
                  Draft
                </span>
              )}

              <span className="inline-flex items-center gap-1">
                <Heart className={`size-4 ${likeCount > 0 ? "text-red-400" : ""}`} />
                {likeCount} {likeCount === 1 ? "like" : "likes"}
              </span>

              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-4" />
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </span>
            </div>

            {/* Keywords */}
            {viewedCorpus.keywords && viewedCorpus.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {viewedCorpus.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-default/20 to-transparent mb-8 sm:mb-12" />

          {/* Article Body - Medium-style typography */}
          <div
            className="
              prose prose-lg prose-invert max-w-none
              prose-headings:text-default prose-headings:font-semibold
              prose-h1:text-3xl prose-h1:sm:text-4xl prose-h1:mt-12 prose-h1:mb-6
              prose-h2:text-2xl prose-h2:sm:text-3xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:sm:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-default/80 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-default prose-strong:font-semibold
              prose-code:text-accent prose-code:bg-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-primary prose-pre:border prose-pre:border-default/10
              prose-blockquote:border-l-accent prose-blockquote:bg-primary/50 prose-blockquote:pl-4 prose-blockquote:py-2
              prose-ul:text-default/80 prose-ol:text-default/80
              prose-li:marker:text-accent
              prose-img:rounded-md prose-img:shadow-lg
            "
            dangerouslySetInnerHTML={{ __html: viewedCorpus.body || "" }}
          />

          {/* Bottom Actions */}
          <footer className="mt-12 sm:mt-16 pt-8 border-t border-default/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLikeToggle}
                  disabled={isCorpusLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    liked
                      ? "bg-red-500/20 text-red-400"
                      : "bg-primary text-default/60 hover:bg-primary/80 hover:text-default"
                  }`}
                >
                  <Heart className={`size-5 ${liked ? "fill-current" : ""}`} />
                  {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                </button>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-default/60 rounded-full text-sm font-medium hover:bg-primary/80 hover:text-default transition-colors"
                >
                  <MessageSquare className="size-5" />
                  {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToNotes}
                  disabled={isCorpusLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent/80 transition-colors"
                >
                  <BookmarkPlus className="size-5" />
                  Save to Notes
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-default/60 rounded-full text-sm font-medium hover:bg-primary/80 hover:text-default transition-colors"
                >
                  <Share2 className="size-5" />
                  Share
                </button>
              </div>
            </div>
          </footer>
        </article>
      </div>

      {/* Comments Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-secondary border-l border-default/10 z-20 transform transition-transform duration-300 ease-in-out ${
          showComments ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Comments Header */}
          <div className="flex items-center justify-between p-4 border-b border-default/10 shrink-0">
            <h3 className="font-semibold text-default flex items-center gap-2">
              <MessageSquare className="size-5" />
              Comments ({comments.length})
            </h3>
            <button
              onClick={() => setShowComments(false)}
              className="p-2 text-default/40 hover:text-default hover:bg-primary rounded-md transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-default/40 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment, idx) => (
                <CommentItem
                  key={`${comment.user_id}-${idx}`}
                  comment={comment}
                  onDelete={() => handleDeleteComment(comment.user_id)}
                />
              ))
            )}
          </div>

          {/* Add Comment */}
          <div className="p-4 border-t border-default/10 shrink-0">
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewComment(e.target.value)
                }
                placeholder="Write a comment..."
                className="flex-1 min-h-20 p-3 bg-primary text-default rounded-md resize-none border border-default/10 focus:border-accent focus:outline-none text-sm"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && e.metaKey) {
                    handleAddComment();
                  }
                }}
              />
            </div>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className="mt-2 w-full py-2.5 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Send className="size-4" />
              Post Comment
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for comments on mobile */}
      {showComments && (
        <div
          className="fixed inset-0 bg-black/50 z-10 sm:hidden"
          onClick={() => setShowComments(false)}
        />
      )}

      {/* Success Dialog */}
      <GlobalDialog
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        title="Success"
        initialWidth={380}
        initialHeight={150}
        resizable={false}
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setSuccessMessage(null)}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 transition-colors"
            >
              OK
            </button>
          </div>
        }
      >
        <p className="text-default text-body">{successMessage}</p>
      </GlobalDialog>
    </div>
  );
};

// =============================================================================
// Comment Item Component
// =============================================================================

interface CommentItemProps {
  comment: CorpusComment;
  onDelete: () => void;
}

const CommentItem: FC<CommentItemProps> = ({ comment, onDelete }) => {
  const getInitials = (userId: string) => {
    return userId.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex gap-3 group">
      <div className="size-8 shrink-0 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-medium">
        {getInitials(comment.user_id)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-default truncate">
              {comment.user_id}
            </span>
            <span className="text-xs text-default/40">
              {formatDate(comment.created_at)}
            </span>
          </div>
          <button
            onClick={onDelete}
            className="p-1 text-default/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
        <p className="text-sm text-default/60 mt-1 whitespace-pre-wrap">
          {comment.comment_text}
        </p>
      </div>
    </div>
  );
};

export default CorpusViewer;
