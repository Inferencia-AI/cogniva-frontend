import type { FC } from "react";
import { Users, Settings } from "lucide-react";
import type { Knowledgebase } from "../../types/knowledgebase";

// =============================================================================
// KnowledgebaseCard - Displays a knowledgebase in card format
// =============================================================================

interface KnowledgebaseCardProps {
  knowledgebase: Knowledgebase;
  onClick?: () => void;
  showActions?: boolean;
  isManaged?: boolean;
  onManage?: () => void;
}

export const KnowledgebaseCard: FC<KnowledgebaseCardProps> = ({
  knowledgebase,
  onClick,
  showActions = false,
  isManaged = false,
  onManage,
}) => {
  const subscribersCount = knowledgebase.subscribers_ids?.length || 0;

  return (
    <div
      className="group relative bg-secondary/20 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-accent/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      onClick={onClick}
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-br from-accent/20 to-accent/5">
        {knowledgebase.banner_url && (
          <img
            src={knowledgebase.banner_url}
            alt={`${knowledgebase.name} banner`}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Image overlay */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-14 h-14 rounded-md bg-primary border-2 border-secondary overflow-hidden flex items-center justify-center">
            {knowledgebase.image_url ? (
              <img
                src={knowledgebase.image_url}
                alt={knowledgebase.name || "Knowledgebase"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-accent">
                {knowledgebase.name?.charAt(0)?.toUpperCase() || "K"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 pb-4 px-4">
        <h3 className="font-semibold text-default text-body truncate">
          {knowledgebase.name || "Untitled Knowledgebase"}
        </h3>
        <p className="text-default/60 text-caption line-clamp-2 mt-1">
          {knowledgebase.description || "No description available"}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-default/10">
          <div className="flex items-center gap-1 text-default/50 text-caption">
            <Users className="size-4" />
            <span>{subscribersCount} subscribers</span>
          </div>

          {showActions && isManaged && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onManage?.();
              }}
              className="p-1.5 rounded-md hover:bg-primary/50 text-default/50 hover:text-accent transition-colors"
            >
              <Settings className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
