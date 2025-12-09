import type { FC } from "react";
import type { ChatSummary } from "../../types/chat";

interface ChatSidebarProps {
  isOpen: boolean;
  chats: ChatSummary[];
  onSelectChat: (chat: ChatSummary) => void;
  onNewChat: () => void;
}

export const ChatSidebar: FC<ChatSidebarProps> = ({ isOpen, chats, onSelectChat, onNewChat }) => {
  return (
    <div className={`transition-all duration-300 ${isOpen ? "sm:w-64 w-full" : "w-0 overflow-hidden opacity-0"} h-full overflow-hidden`}>
      <button className="button w-full text-default" onClick={onNewChat}>
        + New Chat
      </button>
      <hr className="border-accent my-default" />
      <div className="overflow-y-auto overflow-x-hidden h-[80%] p-default flex flex-col gap-default bg-secondary/10 rounded-md scrollbar-thin" dir="rtl">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div key={chat.id} className="p-small hover:bg-accent rounded-md cursor-pointer">
              <button onClick={() => onSelectChat(chat)} className="button bg-secondary/20! w-full">
                {`${chat?.messages?.[0]?.content ?? ""}`}...
              </button>
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
  );
};
