import type { FC } from "react";
import { ArrowLeft, Users, Bell, BellOff, Settings, Trash2 } from "lucide-react";
import type { Knowledgebase } from "../../types/knowledgebase";

// =============================================================================
// KnowledgebaseHeader - Banner and header for knowledgebase detail page
// =============================================================================

interface KnowledgebaseHeaderProps {
  knowledgebase: Knowledgebase;
  isSubscribed: boolean;
  isAdmin: boolean;
  isLoading?: boolean;
  onBack: () => void;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const KnowledgebaseHeader: FC<KnowledgebaseHeaderProps> = ({
  knowledgebase,
  isSubscribed,
  isAdmin,
  isLoading = false,
  onBack,
  onSubscribe,
  onUnsubscribe,
  onEdit,
  onDelete,
}) => {
  const subscribersCount = knowledgebase.subscribers_ids?.length || 0;

  return (
    <div className="relative">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-accent/30 to-accent/5">
        {knowledgebase.banner_url && (
          <img
            src={knowledgebase.banner_url}
            alt={`${knowledgebase.name} banner`}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent" />
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 rounded-lg bg-primary/80 backdrop-blur text-default hover:bg-primary transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>

        {/* Admin actions */}
        {isAdmin && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg bg-primary/80 backdrop-blur text-default hover:bg-primary transition-colors"
              title="Edit knowledgebase"
            >
              <Settings className="size-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg bg-primary/80 backdrop-blur text-red-400 hover:bg-red-500/20 transition-colors"
              title="Delete knowledgebase"
            >
              <Trash2 className="size-5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative px-4 sm:px-6 pb-4 -mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Image */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-secondary border-4 border-primary overflow-hidden flex-shrink-0 flex items-center justify-center">
            {knowledgebase.image_url ? (
              <img
                src={knowledgebase.image_url}
                alt={knowledgebase.name || "Knowledgebase"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-accent">
                {knowledgebase.name?.charAt(0)?.toUpperCase() || "K"}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-default truncate">
              {knowledgebase.name || "Untitled Knowledgebase"}
            </h1>
            <p className="text-default/60 text-body mt-1 line-clamp-2">
              {knowledgebase.description || "No description available"}
            </p>
            
            {/* Stats */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-default/50">
                <Users className="size-4" />
                <span className="text-caption">{subscribersCount} subscribers</span>
              </div>
              <div className="text-default/30">•</div>
              <span className="text-default/50 text-caption">
                {knowledgebase.notes_ids?.length || 0} notes
              </span>
            </div>
          </div>

          {/* Subscribe Button */}
          <div className="flex-shrink-0">
            {isSubscribed ? (
              <button
                onClick={onUnsubscribe}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-default rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                <BellOff className="size-4" />
                <span>Unsubscribe</span>
              </button>
            ) : (
              <button
                onClick={onSubscribe}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-default rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors font-medium"
              >
                <Bell className="size-4" />
                <span>Subscribe</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
