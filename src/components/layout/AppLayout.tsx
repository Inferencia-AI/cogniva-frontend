import { useState, type ReactNode, type FC } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../utils/firebaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import { ChatHeader } from "../chat/ChatHeader";
import { ChatSidebar } from "../chat/ChatSidebar";
import { NotesSidebar, NoteEditor, MobileNoteEditor, TextSelectionPopup, NoteViewer } from "../notes";
import { CorpusViewer, CorpusEditor } from "../knowledgebase";
import { useNotesContext } from "../../context/NotesContext";
import { useChatSession } from "../../hooks/useChatSession";
import {
  SidebarClose,
  SidebarOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  BookOpen,
  HomeIcon,
  ShoppingBagIcon,
  ForkKnifeIcon,
  Code2Icon,
} from "lucide-react";

// =============================================================================
// AppLayout - Shared layout component for authenticated pages
// =============================================================================

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notesSidebarOpen, setNotesSidebarOpen, noteEditorOpen, viewedNote, isNoteViewerOpen, closeNoteViewer } = useNotesContext();
  const {
    user,
    chats,
    selectChat,
    startNewChat,
    deleteChat,
  } = useChatSession();

  // ---------------------------------------------------------------------------
  // Local UI state
  // ---------------------------------------------------------------------------
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleNotesSidebar = () => setNotesSidebarOpen(!notesSidebarOpen);
  const toggleProfileMenu = () => setProfileMenuOpen((prev) => !prev);

  const handleSignOut = () => {
    signOut(auth).then(() => {
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  };

  const handleSelectChat = (chat: typeof chats[number]) => {
    setSidebarOpen(false);
    selectChat(chat);
    navigate("/home");
  };

  const handleNewChat = () => {
    startNewChat();
    navigate("/home");
  };

  const isKnowledgebasePage = location.pathname.startsWith("/knowledgebase");
  const isChatPage = location.pathname === "/home";

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

          {/* Navigation Icons */}
          <div className="relative flex items-center gap-4 bg-secondary/80 p-default rounded-md">
            <button
              onClick={() => {
                if (!isChatPage) navigate("/home");
              }}
              className={`relative p-1 rounded ${
                isChatPage ? "border-b-2 border-accent cursor-default" : "hover:bg-secondary/60"
              }`}
              title="Chat"
            >
              <HomeIcon className="text-primary size-6" />
            </button>

            <button
              onClick={() => {
                if (!isKnowledgebasePage) navigate("/knowledgebase/home");
              }}
              className={`relative p-1 rounded ${
                isKnowledgebasePage ? "border-b-2 border-accent cursor-default" : "hover:bg-secondary/60"
              }`}
              title="Knowledgebase"
            >
              <BookOpen className="text-primary size-6" />
            </button>

            <div
              className="relative p-1 rounded cursor-default"
              onMouseEnter={() => setHoveredIcon("shopping")}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <ShoppingBagIcon className="text-primary/50 size-6" />
              {hoveredIcon === "shopping" && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-secondary border border-default/20 rounded-lg p-2 text-default text-sm whitespace-nowrap shadow-lg z-50">
                  Coming soon!
                </div>
              )}
            </div>

            <div
              className="relative p-1 rounded cursor-default"
              onMouseEnter={() => setHoveredIcon("food")}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <ForkKnifeIcon className="text-primary/50 size-6" />
              {hoveredIcon === "food" && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-secondary border border-default/20 rounded-lg p-2 text-default text-sm whitespace-nowrap shadow-lg z-50">
                  Coming soon!
                </div>
              )}
            </div>

            <div
              className="relative p-1 rounded cursor-default"
              onMouseEnter={() => setHoveredIcon("code")}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <Code2Icon className="text-primary/50 size-6" />
              {hoveredIcon === "code" && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-secondary border border-default/20 rounded-lg p-2 text-default text-sm whitespace-nowrap shadow-lg z-50">
                  Coming soon!
                </div>
              )}
            </div>
          </div>

          {notesSidebarOpen ? (
            <PanelRightCloseIcon onClick={toggleNotesSidebar} className="text-accent bg-secondary size-8 rounded-md cursor-pointer transition-all duration-200 hover:bg-secondary/80" />
          ) : (
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
            onNewChat={handleNewChat}
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
            {children}
          </div>

          {/* Notes Sidebar */}
          <NotesSidebar />
        </div>
      </div>

      {/* Notes Components - Floating */}
      <NoteEditor />
      <MobileNoteEditor />
      <TextSelectionPopup />

      {/* Note Viewer - Read-only view for personal notes */}
      <NoteViewer
        note={viewedNote}
        isOpen={isNoteViewerOpen}
        onClose={closeNoteViewer}
        canEdit={true}
      />

      {/* Corpus Components - For Knowledgebase */}
      <CorpusViewer />
      <CorpusEditor />

      {/* Mobile: Add padding when note editor is open */}
      {noteEditorOpen && <div className="sm:hidden h-[50vh]" />}
    </div>
  );
};
