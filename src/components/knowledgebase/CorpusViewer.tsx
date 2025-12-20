import { useState, useEffect, useCallback, type FC } from "react";
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
import type { Corpus, CorpusComment } from "../../types/corpus";
import { GlobalDialog } from "../ui/GlobalDialog";

// =============================================================================
// Types
// =============================================================================

interface CommentItemProps {
  comment: CorpusComment;
  onDelete: () => void;
  isDeleting: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

const getInitials = (userId: string): string => {
  return userId.substring(0, 2).toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const estimateReadingTime = (body: string | undefined): string => {
  const text = body?.replace(/<[^>]*>/g, "") || "";
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / 200);
  return minutes < 1 ? "1 min read" : `${minutes} min read`;
};

// =============================================================================
// Comment Item Component
// =============================================================================

const CommentItem: FC<CommentItemProps> = ({ comment, onDelete, isDeleting }) => {
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
            disabled={isDeleting}
            className="button p-1 text-red-400 opacity-0 group-hover:opacity-100 disabled:opacity-50"
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

// =============================================================================
// Corpus Viewer Component - Full-screen Medium-style reading experience
// =============================================================================

export const CorpusViewer: FC = () => {
  // ---------------------------------------------------------------------------
  // Context
  // ---------------------------------------------------------------------------
  const {
    viewedCorpus,
    isCorpusViewerOpen,
    closeCorpusViewer,
    likeCorpus,
    unlikeCorpus,
    addComment,
    deleteComment,
    saveCorpusToNotes,
  } = useKnowledgebaseContext();

  // ---------------------------------------------------------------------------
  // Local State - For instant UI updates
  // ---------------------------------------------------------------------------
  const [localCorpus, setLocalCorpus] = useState<Corpus | null>(null);
  const [localLikedUserIds, setLocalLikedUserIds] = useState<string[]>([]);
  const [localComments, setLocalComments] = useState<CorpusComment[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Loading States
  // ---------------------------------------------------------------------------
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Get current user ID from localStorage token
  // ---------------------------------------------------------------------------
  const getCurrentUserId = useCallback((): string | null => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id || payload.uid || payload.sub || null;
    } catch {
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Sync local state when viewedCorpus changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (viewedCorpus) {
      setLocalCorpus(viewedCorpus);
      setLocalLikedUserIds(viewedCorpus.liked_users_ids || []);
      setLocalComments(viewedCorpus.comments || []);
      
      const userId = getCurrentUserId();
      setIsLiked(userId ? (viewedCorpus.liked_users_ids || []).includes(userId) : false);
    }
  }, [viewedCorpus, getCurrentUserId]);

  // ---------------------------------------------------------------------------
  // Handle scroll for sticky header effect
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Lock body scroll when viewer is open
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const handleLikeToggle = useCallback(async () => {
    if (!localCorpus) return;
    
    const userId = getCurrentUserId();
    if (!userId) return;

    setIsLiking(true);
    
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLocalLikedUserIds(prev => 
      wasLiked 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );

    try {
      const success = wasLiked
        ? await unlikeCorpus(localCorpus.id)
        : await likeCorpus(localCorpus.id);
      
      if (success) {
        setSuccessMessage(wasLiked ? "Removed like!" : "Liked!");
      } else {
        // Revert on failure
        setIsLiked(wasLiked);
        setLocalLikedUserIds(prev => 
          wasLiked 
            ? [...prev, userId]
            : prev.filter(id => id !== userId)
        );
      }
    } catch {
      // Revert on error
      setIsLiked(wasLiked);
      setLocalLikedUserIds(prev => 
        wasLiked 
          ? [...prev, userId]
          : prev.filter(id => id !== userId)
      );
    } finally {
      setIsLiking(false);
    }
  }, [localCorpus, isLiked, getCurrentUserId, likeCorpus, unlikeCorpus]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !localCorpus) return;
    
    const userId = getCurrentUserId();
    if (!userId) return;

    setIsCommenting(true);
    
    // Optimistic update
    const newCommentObj: CorpusComment = {
      user_id: userId,
      comment_text: newComment.trim(),
      created_at: new Date().toISOString(),
    };
    setLocalComments(prev => [...prev, newCommentObj]);
    const savedComment = newComment.trim();
    setNewComment("");

    try {
      const success = await addComment(localCorpus.id, savedComment);
      if (success) {
        setSuccessMessage("Comment added!");
      } else {
        // Revert on failure
        setLocalComments(prev => prev.filter(c => c !== newCommentObj));
        setNewComment(savedComment);
      }
    } catch {
      // Revert on error
      setLocalComments(prev => prev.filter(c => c !== newCommentObj));
      setNewComment(savedComment);
    } finally {
      setIsCommenting(false);
    }
  }, [newComment, localCorpus, getCurrentUserId, addComment]);

  const handleDeleteComment = useCallback(async (commentCreatedAt: string) => {
    if (!localCorpus) return;
    if (!window.confirm("Delete this comment?")) return;

    setIsDeletingComment(true);
    
    // Find and remove the comment optimistically
    const commentToDelete = localComments.find(c => c.created_at === commentCreatedAt);
    if (!commentToDelete) return;
    
    setLocalComments(prev => prev.filter(c => c.created_at !== commentCreatedAt));

    try {
      const success = await deleteComment(localCorpus.id, commentCreatedAt);
      if (success) {
        setSuccessMessage("Comment deleted!");
      } else {
        // Revert on failure
        setLocalComments(prev => [...prev, commentToDelete]);
      }
    } catch {
      // Revert on error
      setLocalComments(prev => [...prev, commentToDelete]);
    } finally {
      setIsDeletingComment(false);
    }
  }, [localCorpus, localComments, deleteComment]);

  const handleSaveToNotes = useCallback(async () => {
    if (!localCorpus) return;

    setIsSaving(true);
    try {
      const note = await saveCorpusToNotes(localCorpus.id);
      if (note) {
        setSuccessMessage("Saved to your notes!");
      }
    } finally {
      setIsSaving(false);
    }
  }, [localCorpus, saveCorpusToNotes]);

  const handleShare = useCallback(async () => {
    if (!localCorpus) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: localCorpus.title || "Shared from Cogniva",
          text: localCorpus.title || "",
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSuccessMessage("Link copied!");
    }
  }, [localCorpus]);

  const handleCloseDialog = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const handleClose = useCallback(() => {
    closeCorpusViewer();
    // Reset local state
    setLocalCorpus(null);
    setLocalLikedUserIds([]);
    setLocalComments([]);
    setIsLiked(false);
    setNewComment("");
    setShowComments(false);
  }, [closeCorpusViewer]);

  // ---------------------------------------------------------------------------
  // Derived Values
  // ---------------------------------------------------------------------------
  const likeCount = localLikedUserIds.length;
  const commentCount = localComments.length;
  const isAnyLoading = isLiking || isCommenting || isSaving || isDeletingComment;

  // ---------------------------------------------------------------------------
  // Early return if not visible
  // ---------------------------------------------------------------------------
  if (!isCorpusViewerOpen || !localCorpus) return null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-primary animate-fade-in">
      {/* ===== Fixed Header ===== */}
      <Header
        title={localCorpus.title}
        scrolled={scrolled}
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        showComments={showComments}
        isLiking={isLiking}
        isSaving={isSaving}
        isAnyLoading={isAnyLoading}
        onClose={handleClose}
        onLikeToggle={handleLikeToggle}
        onToggleComments={() => setShowComments(!showComments)}
        onSaveToNotes={handleSaveToNotes}
        onShare={handleShare}
      />

      {/* ===== Scrollable Body ===== */}
      <div id="corpus-viewer-scroll" className="flex-1 overflow-y-auto">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <ArticleHeader
            corpus={localCorpus}
            likeCount={likeCount}
            commentCount={commentCount}
          />
          <Divider />
          <ArticleBody body={localCorpus.body} />
        </article>
      </div>

      {/* ===== Fixed Footer ===== */}
      <Footer
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        isLiking={isLiking}
        isCommenting={isCommenting}
        isSaving={isSaving}
        isAnyLoading={isAnyLoading}
        onLikeToggle={handleLikeToggle}
        onToggleComments={() => setShowComments(!showComments)}
        onSaveToNotes={handleSaveToNotes}
        onShare={handleShare}
      />

      {/* ===== Comments Sidebar ===== */}
      <CommentsSidebar
        comments={localComments}
        showComments={showComments}
        newComment={newComment}
        isCommenting={isCommenting}
        isDeletingComment={isDeletingComment}
        onClose={() => setShowComments(false)}
        onNewCommentChange={setNewComment}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      {/* ===== Mobile Overlay ===== */}
      {showComments && (
        <div
          className="fixed inset-0 bg-black/50 z-10 sm:hidden"
          onClick={() => setShowComments(false)}
        />
      )}

      {/* ===== Success Dialog ===== */}
      <GlobalDialog
        isOpen={!!successMessage}
        onClose={handleCloseDialog}
        title="Success"
        initialWidth={320}
        initialHeight={140}
        resizable={false}
        footer={
          <div className="flex justify-end">
            <button onClick={handleCloseDialog} className="button bg-accent text-white">
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
// Sub-Components
// =============================================================================

interface HeaderProps {
  title: string | undefined;
  scrolled: boolean;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  showComments: boolean;
  isLiking: boolean;
  isSaving: boolean;
  isAnyLoading: boolean;
  onClose: () => void;
  onLikeToggle: () => void;
  onToggleComments: () => void;
  onSaveToNotes: () => void;
  onShare: () => void;
}

const Header: FC<HeaderProps> = ({
  title,
  scrolled,
  isLiked,
  showComments,
  isLiking,
  isSaving,
  isAnyLoading,
  onClose,
  onLikeToggle,
  onToggleComments,
  onSaveToNotes,
  onShare,
}) => (
  <header
    className={`flex-shrink-0 z-10 transition-all duration-300 ${
      scrolled
        ? "bg-secondary/95 backdrop-blur-md border-b border-default/10 shadow-sm"
        : "bg-secondary border-b border-default/10"
    }`}
  >
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <button onClick={onClose} className="button inline-flex items-center gap-2">
          <ArrowLeft className="size-5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <h1
          className={`font-medium text-default truncate max-w-md transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        >
          {title || "Untitled"}
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={onLikeToggle}
            disabled={isLiking || isAnyLoading}
            className={`button p-2 ${isLiked ? "bg-red-500/20 text-red-400" : ""}`}
            title={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={`size-5 ${isLiked ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={onToggleComments}
            className={`button p-2 ${showComments ? "bg-accent/20 text-accent" : ""}`}
            title="Comments"
          >
            <MessageSquare className="size-5" />
          </button>
          <button
            onClick={onSaveToNotes}
            disabled={isSaving || isAnyLoading}
            className="button p-2"
            title="Save to Notes"
          >
            <BookmarkPlus className="size-5" />
          </button>
          <button onClick={onShare} className="button p-2" title="Share">
            <Share2 className="size-5" />
          </button>
        </div>
      </div>
    </div>
  </header>
);

interface ArticleHeaderProps {
  corpus: Corpus;
  likeCount: number;
  commentCount: number;
}

const ArticleHeader: FC<ArticleHeaderProps> = ({ corpus, likeCount, commentCount }) => (
  <header className="mb-8 sm:mb-12">
    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-default leading-tight mb-6">
      {corpus.title || "Untitled"}
    </h1>

    <div className="flex flex-wrap items-center gap-3 text-sm text-default/50">
      <span className="inline-flex items-center gap-1">
        <Clock className="size-4" />
        {estimateReadingTime(corpus.body)}
      </span>

      {corpus.is_approved ? (
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
        {commentCount} {commentCount === 1 ? "comment" : "comments"}
      </span>
    </div>

    {corpus.keywords && corpus.keywords.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-4">
        {corpus.keywords.map((keyword, idx) => (
          <span key={idx} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full">
            {keyword}
          </span>
        ))}
      </div>
    )}
  </header>
);

const Divider: FC = () => (
  <div className="w-full h-px bg-gradient-to-r from-transparent via-default/20 to-transparent mb-8 sm:mb-12" />
);

interface ArticleBodyProps {
  body: string | undefined;
}

const ArticleBody: FC<ArticleBodyProps> = ({ body }) => (
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
    dangerouslySetInnerHTML={{ __html: body || "" }}
  />
);

interface FooterProps {
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  isLiking: boolean;
  isCommenting: boolean;
  isSaving: boolean;
  isAnyLoading: boolean;
  onLikeToggle: () => void;
  onToggleComments: () => void;
  onSaveToNotes: () => void;
  onShare: () => void;
}

const Footer: FC<FooterProps> = ({
  isLiked,
  likeCount,
  commentCount,
  isLiking,
  isCommenting,
  isSaving,
  isAnyLoading,
  onLikeToggle,
  onToggleComments,
  onSaveToNotes,
  onShare,
}) => (
  <footer className="flex-shrink-0 border-t border-default/10 bg-secondary/95 backdrop-blur-md">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onLikeToggle}
            disabled={isLiking || isAnyLoading}
            className={`button inline-flex items-center gap-2 text-sm font-medium ${
              isLiked ? "bg-red-500/20 text-red-400" : ""
            }`}
          >
            <Heart className={`size-5 ${isLiked ? "fill-current" : ""}`} />
            {likeCount} {likeCount === 1 ? "Like" : "Likes"}
          </button>
          <button
            onClick={onToggleComments}
            disabled={isCommenting}
            className="button inline-flex items-center gap-2 text-sm font-medium"
          >
            <MessageSquare className="size-5" />
            {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSaveToNotes}
            disabled={isSaving || isAnyLoading}
            className="button inline-flex items-center gap-2 bg-accent text-white text-sm font-medium"
          >
            <BookmarkPlus className="size-5" />
            Save to Notes
          </button>
          <button
            onClick={onShare}
            className="button inline-flex items-center gap-2 text-sm font-medium"
          >
            <Share2 className="size-5" />
            Share
          </button>
        </div>
      </div>
    </div>
  </footer>
);

interface CommentsSidebarProps {
  comments: CorpusComment[];
  showComments: boolean;
  newComment: string;
  isCommenting: boolean;
  isDeletingComment: boolean;
  onClose: () => void;
  onNewCommentChange: (value: string) => void;
  onAddComment: () => void;
  onDeleteComment: (createdAt: string) => void;
}

const CommentsSidebar: FC<CommentsSidebarProps> = ({
  comments,
  showComments,
  newComment,
  isCommenting,
  isDeletingComment,
  onClose,
  onNewCommentChange,
  onAddComment,
  onDeleteComment,
}) => (
  <div
    className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-secondary border-l border-default/10 z-20 transform transition-transform duration-300 ease-in-out ${
      showComments ? "translate-x-0" : "translate-x-full"
    }`}
  >
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-default/10 shrink-0">
        <h3 className="font-semibold text-default flex items-center gap-2">
          <MessageSquare className="size-5" />
          Comments ({comments.length})
        </h3>
        <button onClick={onClose} className="button p-2">
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
              key={`${comment.user_id}-${comment.created_at}-${idx}`}
              comment={comment}
              onDelete={() => onDeleteComment(comment.created_at || "")}
              isDeleting={isDeletingComment}
            />
          ))
        )}
      </div>

      {/* Add Comment */}
      <div className="p-4 border-t border-default/10 shrink-0">
        <textarea
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          placeholder="Write a comment..."
          className="w-full min-h-20 p-3 bg-primary text-default rounded-md resize-none border border-default/10 focus:border-accent focus:outline-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              onAddComment();
            }
          }}
        />
        <button
          onClick={onAddComment}
          disabled={!newComment.trim() || isCommenting}
          className="button mt-2 w-full bg-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="size-4" />
          {isCommenting ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </div>
  </div>
);

export default CorpusViewer;
