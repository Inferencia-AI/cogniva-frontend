import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import { useChatSession } from "../hooks/useChatSession";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatComposer } from "../components/chat/ChatComposer";
import ChatMessageList from "../components/chat/ChatMessageList";
import { SidebarClose, SidebarOpenIcon } from "lucide-react";

// =============================================================================
// Home Page - Main chat interface
// =============================================================================

export default function Home() {
  // ---------------------------------------------------------------------------
  // Chat session state from custom hook
  // ---------------------------------------------------------------------------
  const {
    user,
    messages,
    chats,
    isProcessingUrl,
    isWebSearchMode,
    isReplying,
    submitPrompt,
    startNewChat,
    selectChat,
    setIsWebSearchMode,
  } = useChatSession();

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleProfileMenu = () => setProfileMenuOpen((prev) => !prev);

  const handleSubmit = () => {
    if (isProcessingUrl || !input.trim()) return;
    submitPrompt(input);
    setInput("");
  };

  const handleSignOut = () => {
    signOut(auth).then(() => {
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  };

  const handleSelectChat = (chat: typeof chats[number]) => {
    setSidebarOpen(false);
    selectChat(chat);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col bg-primary h-full">
      {/* Header */}
      <ChatHeader
        user={user}
        profileMenuOpen={profileMenuOpen}
        onToggleProfileMenu={toggleProfileMenu}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-col gap-default p-default h-full overflow-auto">
        {/* Sidebar toggle button */}
        <div onClick={toggleSidebar} className="cursor-pointer">
          {sidebarOpen ? (
            <SidebarClose className="text-accent bg-secondary size-8 rounded-md" />
          ) : (
            <SidebarOpenIcon className="text-accent bg-secondary size-8 rounded-md" />
          )}
        </div>

        <div className="flex gap-default h-full overflow-hidden">
          {/* Sidebar */}
          <ChatSidebar
            isOpen={sidebarOpen}
            chats={chats}
            onSelectChat={handleSelectChat}
            onNewChat={startNewChat}
          />

          {/* Main content area */}
          <div
            className={`transition-all duration-300 ${
              sidebarOpen ? "sm:w-[calc(100%-16rem)] w-0" : "w-full"
            } relative`}
          >
            {messages.length > 0 ? (
              <ChatMessageList messages={messages} isReplying={isReplying} />
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center h-full">
                <p className="text-default text-heading">Welcome to Cogniva Chat!</p>
                <p className="text-default/50 text-body">
                  Start a new chat by typing a message below.
                </p>
              </div>
            )}

            {/* Message composer */}
            <ChatComposer
              input={input}
              isProcessingUrl={isProcessingUrl}
              isWebSearchMode={isWebSearchMode}
              isSidebarOpen={sidebarOpen}
              onChange={setInput}
              onSubmit={handleSubmit}
              onToggleWebSearch={() => setIsWebSearchMode((prev) => !prev)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
