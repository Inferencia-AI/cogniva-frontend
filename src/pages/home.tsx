import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import { useChatSession } from "../hooks/useChatSession";
import { ChatHeader } from "../components/chat/ChatHeader";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatComposer } from "../components/chat/ChatComposer";
import ChatMessageList from "../components/chat/ChatMessageList";
import { NotesProvider, useNotesContext } from "../context/NotesContext";
import { KnowledgebaseProvider } from "../context/KnowledgebaseContext";
import { NotesSidebar, NoteEditor, MobileNoteEditor, TextSelectionPopup } from "../components/notes";
import { Code2Icon, ForkKnifeIcon, HomeIcon, ShoppingBagIcon, SidebarClose, SidebarOpenIcon, PanelRightCloseIcon, PanelRightOpenIcon, BookOpen, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    deleteChat,
    setIsWebSearchMode,
  } = useChatSession();

  return (
    <NotesProvider userId={user?.user?.uid}>
      <KnowledgebaseProvider userId={user?.user?.uid}>
        <HomeContent
          user={user}
          messages={messages}
          chats={chats}
          isProcessingUrl={isProcessingUrl}
          isWebSearchMode={isWebSearchMode}
          isReplying={isReplying}
          submitPrompt={submitPrompt}
          startNewChat={startNewChat}
          selectChat={selectChat}
          deleteChat={deleteChat}
          setIsWebSearchMode={setIsWebSearchMode}
        />
      </KnowledgebaseProvider>
    </NotesProvider>
  );
}

// =============================================================================
// HomeContent - Inner component with access to notes context
// =============================================================================

interface HomeContentProps {
  user: ReturnType<typeof useChatSession>["user"];
  messages: ReturnType<typeof useChatSession>["messages"];
  chats: ReturnType<typeof useChatSession>["chats"];
  isProcessingUrl: boolean;
  isWebSearchMode: boolean;
  isReplying: boolean;
  submitPrompt: (prompt: string) => void;
  startNewChat: () => void;
  selectChat: (chat: ReturnType<typeof useChatSession>["chats"][number]) => void;
  deleteChat: (chatId: number) => Promise<void>;
  setIsWebSearchMode: React.Dispatch<React.SetStateAction<boolean>>;
}

function HomeContent({
  user,
  messages,
  chats,
  isProcessingUrl,
  isWebSearchMode,
  isReplying,
  submitPrompt,
  startNewChat,
  selectChat,
  deleteChat,
  setIsWebSearchMode,
}: HomeContentProps) {
  const navigate = useNavigate();
  const { notesSidebarOpen, setNotesSidebarOpen, noteEditorOpen } = useNotesContext();

  const toggleNotesSidebar = () => setNotesSidebarOpen(!notesSidebarOpen);

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

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
        {/* Sidebar toggle button and navigation */}
        <div className="flex justify-between">
          {sidebarOpen ? (
            <SidebarClose onClick={toggleSidebar} className="text-accent bg-secondary size-8 rounded-md cursor-pointer" />
          ) : (
            <div>
            <SidebarOpenIcon onClick={toggleSidebar} className="text-accent bg-secondary size-8 rounded-md cursor-pointer" />
            <p className="text-default/30 text-caption text-center">Chats</p>
            </div>
          )}
            {/* Navigation and Coming Soon Features */}
            <div 
              className="relative flex items-center gap-4 bg-secondary/80 p-default rounded-md"
            >
              <div
                className="relative p-1 cursor-default border-b-2 border-accent"
                onMouseEnter={() => setHoveredIcon('home')}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <HomeIcon className="text-primary size-6" />
              </div>
              <div
                className="relative p-1 cursor-default"
                onMouseEnter={() => setHoveredIcon('knowledgebase')}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => navigate("/knowledgebase/home")}
              >
                <BookOpen className="text-primary size-6" />
              </div>

              <div
                className="relative p-1 cursor-default"
                onMouseEnter={() => setHoveredIcon('shopping')}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <ShoppingBagIcon className="text-primary/50 size-6" />
                {hoveredIcon === 'shopping' && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-secondary border border-default/20-lg p-2 text-default text-sm whitespace-nowrap shadow-lg z-50">
                    Coming soon!
                  </div>
                )}
              </div>

              <div
                className="relative p-1 cursor-default"
                onMouseEnter={() => setHoveredIcon('food')}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <ForkKnifeIcon className="text-primary/50 size-6" />
                {hoveredIcon === 'food' && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-secondary border border-default/20 rounded-md p-2 text-default text-sm whitespace-nowrap shadow-lg z-50">
                    Coming soon!
                  </div>
                )}
              </div>

              <div
                className="relative p-1 rounded cursor-default"
                onMouseEnter={() => setHoveredIcon('code')}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <Code2Icon className="text-primary/50 size-6" />
                {hoveredIcon === 'code' && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-secondary border border-default/20 rounded-md p-2 text-default text-sm whitespace-nowrap shadow-lg z-50">
                    Coming soon!
                  </div>
                )}
              </div>
            </div>
            {notesSidebarOpen ? (
              <PanelRightCloseIcon onClick={toggleNotesSidebar} className="text-accent bg-secondary size-8 rounded-md cursor-pointer transition-all duration-200 hover:bg-secondary/80" />
            ) : (
              // <button onClick={toggleNotesSidebar} className="text-accent bg-secondary/80 p-default rounded-md cursor-pointer flex items-center gap-2 hover:bg-secondary transition-all duration-200">
              //   <StickyNoteIcon className="size-6 text-accent" />
              //   <span className="hidden sm:inline">Notes</span>
              //   <SidebarOpenIcon className="size-5 text-accent" />
              // </button>
              <div>
              <PanelRightOpenIcon onClick={toggleNotesSidebar} className="text-accent bg-secondary size-8 rounded-md cursor-pointer transition-all duration-200 hover:bg-secondary/80" />
              <p className="text-default/30 text-caption text-center">Notes</p>
              </div>
            )}
        </div>

        <div className="flex gap-default h-full overflow-hidden relative">
          {/* Chat Sidebar */}
          <ChatSidebar
            isOpen={sidebarOpen}
            chats={chats}
            onSelectChat={handleSelectChat}
            onNewChat={startNewChat}
            onDeleteChat={deleteChat}
          />

          {/* Main content area */}
          <div
            className={`transition-all duration-300 relative ${
              sidebarOpen && notesSidebarOpen
                ? "sm:w-[calc(100%-32rem)] w-full"
                : sidebarOpen || notesSidebarOpen
                ? "sm:w-[calc(100%-16rem)] w-full"
                : "w-full"
            } ${(sidebarOpen || notesSidebarOpen) ? "max-sm:invisible max-sm:pointer-events-none" : ""}`}
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

          {/* Notes Sidebar */}
          <NotesSidebar />
        </div>
      </div>

      {/* Notes Components - Floating */}
      <NoteEditor />
      <MobileNoteEditor />
      <TextSelectionPopup />

      {/* Mobile: Add padding when note editor is open */}
      {noteEditorOpen && <div className="sm:hidden h-[50vh]" />}
    </div>
  );
}
