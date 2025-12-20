import { type FC } from "react";

// =============================================================================
// UploadToKnowledgebaseDialog - DEPRECATED
// Notes are now personal-only. Use Corpus for knowledgebase content.
// =============================================================================

interface UploadToKnowledgebaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: number;
  noteTitle: string;
}

export const UploadToKnowledgebaseDialog: FC<UploadToKnowledgebaseDialogProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-primary border border-accent rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 text-center">
        <p className="text-default">
          This feature has been deprecated. Notes are now for personal use only.
        </p>
        <p className="text-default/60 mt-2">
          To add content to a knowledgebase, please use the Corpus feature from the knowledgebase page.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-accent text-white rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};
