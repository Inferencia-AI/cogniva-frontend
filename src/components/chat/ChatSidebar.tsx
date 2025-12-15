import { useState, useMemo, type FC } from "react";
import { TrashIcon, SearchIcon } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((chat) => {
      const preview = getChatPreview(chat).toLowerCase();
      return preview.includes(query);
    });
  }, [chats, searchQuery]);

  return (
    <>
      <div
        className={`transition-all duration-300 h-full overflow-hidden ${
          isOpen ? "sm:w-64 w-full" : "w-0 overflow-hidden opacity-0"
        } ${
          isOpen
            ? "max-sm:absolute max-sm:inset-0 max-sm:z-40 max-sm:w-full max-sm:h-full max-sm:bg-primary max-sm:p-default"
            : "max-sm:absolute max-sm:inset-0 max-sm:z-40 max-sm:w-0 max-sm:h-full max-sm:opacity-0 max-sm:pointer-events-none"
        }`}
      >
        <button className="button w-full text-default" onClick={onNewChat}>
          + New Chat
        </button>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-default/50" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary/30 border border-accent/30 rounded-md text-default text-body placeholder:text-default/40 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <hr className="border-accent my-default" />
        <div className="overflow-y-auto overflow-x-hidden h-[75%] p-default flex flex-col gap-default bg-secondary/10 rounded-md scrollbar-thin" dir="rtl">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
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
            <p className="text-default text-body p-default text-center">
              {searchQuery ? "No chats found." : "No previous chats."}
            </p>
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
