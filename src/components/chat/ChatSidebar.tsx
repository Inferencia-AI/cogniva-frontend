import { useState, type FC } from "react";
import { TrashIcon } from "lucide-react";
import { ConfirmDialog } from "../ui";
import type { ChatSummary } from "../../types/chat";

// =============================================================================
// ChatSidebar - Left sidebar for listing and managing chats
// =============================================================================

interface ChatSidebarProps {
  isOpen: boolean;
  chats: ChatSummary[];
  onSelectChat: (chat: ChatSummary) => void;
  onNewChat: () => void;
  onDeleteChat?: (chatId: number) => Promise<void>;
}

export const ChatSidebar: FC<ChatSidebarProps> = ({ 
  isOpen, 
  chats, 
  onSelectChat, 
  onNewChat,
  onDeleteChat 
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, chat: ChatSummary) => {
    e.stopPropagation();
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete || !onDeleteChat) return;
    setIsDeleting(true);
    await onDeleteChat(chatToDelete.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  const getChatPreview = (chat: ChatSummary): string => {
    const firstMessage = chat?.messages?.[0]?.content;
    if (typeof firstMessage === "string") {
      return firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "");
    }
    return "Chat";
  };

  return (
    <>
      <div className={`transition-all duration-300 ${isOpen ? "sm:w-64 w-full" : "w-0 overflow-hidden opacity-0"} h-full overflow-hidden`}>
        <button className="button w-full text-default" onClick={onNewChat}>
          + New Chat
        </button>
        <hr className="border-accent my-default" />
        <div className="overflow-y-auto overflow-x-hidden h-[80%] p-default flex flex-col gap-default bg-secondary/10 rounded-md scrollbar-thin" dir="rtl">
          {chats.length > 0 ? (
            chats.map((chat) => (
              <div 
                key={chat.id} 
                className="button bg-secondary/20! p-small hover:bg-accent rounded-md cursor-pointer group" 
                dir="ltr"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => onSelectChat(chat)} 
                    className="cursor-pointer w-full text-left truncate"
                  >
                    {getChatPreview(chat)}
                  </button>
                  {onDeleteChat && (
                    <button
                      onClick={(e) => handleDeleteClick(e, chat)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer ml-2"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-default text-body p-default text-center">No previous chats.</p>
          )}
        </div>
        <hr className="border-accent my-default" />
        <div className="text-default text-caption text-center">
          <img src="/cogniva-landscape-logo.svg" className="h-14 mx-auto mb-small rounded-md" alt="Cogniva Logo" />
          &copy; {new Date().getFullYear()} Cogniva. All rights reserved.
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Chat"
        message="Are you sure you want to delete this chat? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
