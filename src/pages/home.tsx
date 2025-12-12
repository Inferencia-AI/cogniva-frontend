import { useEffect, useState } from "react";
import api from "../utils/api";
import simpleChat from "../schemas/simpleChat.json" with { type: "json" };
import codeChat from "../schemas/codeChatSchema.json" with { type: "json" };
import type { AiSection, AiSource } from "../types/chat";
import { Globe2Icon, MessageCircleCodeIcon, 
  // Mic2Icon,
   SendIcon, SidebarClose, SidebarOpenIcon } from 'lucide-react'
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import ChatMessageList from "../components/chat/ChatMessageList";


export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any>([]);
  const [chats, setChats] = useState<any>([]);
  const [selectedChat, setSelectedChat] = useState<number | undefined>(undefined);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [isWebSearchMode, setIsWebSearchMode] = useState(false);
  const [isReplying, setIsReplying] = useState<boolean>(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  }

  const handleSubmit = () => {
    if (isProcessingUrl) return;

    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    if (isWebSearchMode) {
      handleWebSearch(trimmedInput);
    } else {
      handleSendMessage(trimmedInput);
    }

    setInput("");
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get("/user");
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      const newToken = await getIdToken(auth.currentUser!, true);
      localStorage.setItem("token", newToken);
      window.location.reload();
    }
  };

  const fetchChats = async () => {
    try {
      //@ts-ignore
      const uid = user.user.uid;
      const response = await api.get(`/chats/${uid}`);
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }

  const handleChatClick = (chat: any) => {
    setSidebarOpen(false);
    setMessages(chat.messages);
    setSelectedChat(chat.id);
  };

  const handleNewChat = () => {
    setMessages([]);
    setSelectedChat(undefined);
  }

  const handleSendMessage = async (prompt: string) => {
    const newMessages = [...messages, { role: "human", content: prompt }];
    setMessages(newMessages);
    setIsReplying(true);
    
    try {
      const response = await api.post("/chat", { messages: newMessages, schema: [simpleChat, codeChat] });
      const aiPayload = Array.isArray(response.data) ? response.data.flat() : [response.data];
      setMessages([...newMessages, { role: "ai", content: aiPayload }]);
      const savedChat = await api.post("/save-chat", {userId: user?.user?.uid, messages: [...newMessages, { role: "ai", content: aiPayload }], chatId: selectedChat})
      if (!selectedChat) {
        setChats([...chats, savedChat.data[0]]);
        setSelectedChat(savedChat.data[0].id);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsReplying(false);
    }
  };

  const handleWebSearch = async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    const sanitizeImages = (images: string[]) =>
      (images || []).filter((src) => typeof src === "string" && /^https?:\/\//i.test(src)).filter(Boolean);

    const sanitizeUrl = (value?: string | null) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
    };

    const sanitizeOtherEntry = (entry: any) => {
      const link = sanitizeUrl(entry?.link);
      const images = Array.isArray(entry?.data?.images) ? sanitizeImages(entry.data.images) : [];
      const texts = Array.isArray(entry?.data?.texts) ? entry.data.texts.filter(Boolean) : [];
      const links = Array.isArray(entry?.data?.links)
        ? entry.data.links.map(sanitizeUrl).filter(Boolean)
        : [];

      return {
        link,
        data: { images, texts, links },
      };
    };

    const pendingMessages = [...messages, { role: "human", content: trimmedQuery }];
    setMessages(pendingMessages);
    setIsProcessingUrl(true);
    setIsReplying(true);

    try {
      const searchResponse = await api.post("/web-answer", {
        question: trimmedQuery,
      });

      const {answer, image,  promoted, wikipedia_answer, duckduckgo_answer, others } = searchResponse.data || {};
      const sanitizedOthers = Array.isArray(others) ? others.map(sanitizeOtherEntry) : [];

      const sections: AiSection[] = [];

      if (promoted) {
        const links = Array.isArray(promoted.links) ? promoted.links.filter(Boolean) : [];
        sections.push({
          type: "promoted",
          topic: promoted.heading,
          response: promoted.summary,
          images: sanitizeImages(promoted.images || []),
          sources: links.map((link: string) => ({ title: link, url: link, snippet: "" } as AiSource)),
          promoted,
        });
      }

      if (answer) {
        sections.push({
          type: "answer",
          topic: "Answer",
          response: answer,
          image: image,
          // sources: [],
          // images: [],
        });
      }

      if (wikipedia_answer) {
        const references = Array.isArray(wikipedia_answer.references) ? wikipedia_answer.references.filter(Boolean) : [];
        sections.push({
          type: "wikipedia",
          topic: wikipedia_answer.question || "Wikipedia",
          response: wikipedia_answer.summary,
          sources: references.map((link: string) => ({ title: link, url: link, snippet: "" })),
          wikipedia: wikipedia_answer,
        });
      }

      if (duckduckgo_answer && (duckduckgo_answer.answer || duckduckgo_answer.link)) {
        const link = duckduckgo_answer.link?.trim();
        sections.push({
          type: "duckduckgo",
          topic: "DuckDuckGo",
          response: duckduckgo_answer.answer,
          sources: link ? [{ title: link, url: link, snippet: "" }] : [],
          duckduckgo: duckduckgo_answer,
        });
      }

      if (sanitizedOthers.length) {
        sections.push({ type: "others", topic: "Other sources", response: "", others: sanitizedOthers });
      }
      const summarizeSection = async (section: AiSection) => {
        const baseText = typeof section.response === "string" ? section.response : section.topic || "web result";
        const prompt = `Summarize the following web result in 3 concise sentences. Keep it factual and brief.\n\n${baseText}`;

        try {
          const res = await api.post("/chat", {
            messages: [{ role: "human", content: prompt }],
            schema: [simpleChat],
          });

          const aiPayload = (Array.isArray(res.data) ? res.data.flat() : [res.data]) as AiSection[];
          const first = aiPayload[0];

          if (!first) return baseText;
          if (typeof first === "string") return first;
          if (Array.isArray(first.response)) {
            return first.response
              .map((snippet) => (typeof snippet === "string" ? snippet : snippet?.text || snippet?.code || ""))
              .filter(Boolean)
              .join("\n");
          }
          if (typeof first.response === "string") return first.response;
          return baseText;
        } catch (error) {
          console.error("Error summarizing section:", error);
          return baseText;
        }
      };

      const summarizedSections: AiSection[] = [];

      for (const section of sections) {
        const summary = await summarizeSection(section);
        const updatedSection: AiSection = {
          ...section,
          response: summary,
        };

        if (section.type === "promoted" && section.promoted) {
          updatedSection.promoted = { ...section.promoted, summary };
        }

        if (section.type === "wikipedia" && section.wikipedia) {
          updatedSection.wikipedia = { ...section.wikipedia, summary };
        }

        if (section.type === "duckduckgo" && section.duckduckgo) {
          updatedSection.duckduckgo = { ...section.duckduckgo, answer: summary || section.duckduckgo.answer };
        }

        summarizedSections.push(updatedSection);
        setMessages([...pendingMessages, { role: "ai", content: [...summarizedSections] }]);
      }

      if (!sections.length) {
        setMessages([
          ...pendingMessages,
          {
            role: "ai",
            content: [
              {
                topic: `"${trimmedQuery}"`,
                response: "No results found.",
                sources: [],
                images: [],
              },
            ],
          },
        ]);
      }

      const savedChat = await api.post("/save-chat", {
        userId: user?.user?.uid,
        messages: [...pendingMessages, { role: "ai", content: summarizedSections.length ? summarizedSections : [] }],
        chatId: selectedChat,
      });

      if (!selectedChat) {
        setChats([...chats, savedChat.data[0]]);
        setSelectedChat(savedChat.data[0].id);
      }
    } catch (error) {
      console.error("Error completing web search:", error);
      setMessages([
        ...pendingMessages,
        {
          role: "ai",
          content: [
            {
              topic: `Search error for "${trimmedQuery}"`,
              response: "Sorry, I couldn't complete that search. Please try again.",
            },
          ],
        },
      ]);
    } finally {
      setIsProcessingUrl(false);
      setIsReplying(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  return (
    <div className="flex flex-col bg-primary h-full">
      <div className="flex p-default items-center justify-between border-b border-accent shadow-md">
        {/* header */}
        <div className="flex items-center gap-default">
          <img onClick={toggleProfileMenu} src={user?.user.picture} className="rounded-full size-12" alt="User Avatar" />
          <div className="sm:block hidden">
            <p className="text-default text-body">{user?.user.name}</p>
            <p className="text-default text-caption">{user?.user.email}</p>
          </div>

          <div className={`transition-all duration-300 ${profileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} absolute top-16 left-4 bg-secondary shadow-md rounded-md flex flex-col gap-default`}>
            <button className="button" onClick={() => {
              signOut(auth).then(() => {
                localStorage.removeItem("token");
                window.location.href = "/";
              });
            }}>Sign Out</button>
          </div>

        </div>

        <img src="/cogniva-landscape-logo.svg" className="h-20" alt="Cogniva Logo" />
      </div>

      <div className="flex flex-col gap-default p-default h-full overflow-auto">
        <div onClick={toggleSidebar}>
          {
            sidebarOpen ? <SidebarClose className="text-accent bg-secondary size-8 rounded-md" /> :
              <SidebarOpenIcon className="text-accent bg-secondary size-8 rounded-md" />
          }
        </div>
        <div className="flex gap-default h-full overflow-hidden">
          {/* sidebar and main content */}
          <div className={`transition-all duration-300 ${sidebarOpen ? 'sm:w-64 w-full' : 'w-0 overflow-hidden opacity-0'} h-full overflow-hidden`}>
            {/* sidebar */}
            <button className="button w-full text-default" onClick={handleNewChat}>+ New Chat</button>
            <hr className="border-accent my-default" />
            <div className="overflow-y-auto overflow-x-hidden h-[80%] p-default flex flex-col gap-default bg-secondary/10 rounded-md scrollbar-thin  " dir="rtl"> 
              {/* Chat history would go here */}
              {
                chats.length > 0 ? chats.map((chat: any, index: number) => (
                  <div key={index} className="p-small hover:bg-accent rounded-md cursor-pointer">
                    <button
                    onClick={()=> handleChatClick(chat)}
                    className="button bg-secondary/20! w-full">{chat?.messages[0]?.content}...</button>
                  </div>
                )) :
                  <p className="text-default text-body p-default text-center">No previous chats.</p>
              }
            </div>
            <hr className="border-accent my-default" />
            <div className="text-default text-caption text-center">
              <img src="/cogniva-landscape-logo.svg" className="h-14 mx-auto mb-small rounded-md" alt="Cogniva Logo" />
              &copy; 
              {new Date().getFullYear() + " "}
               Cogniva. All rights reserved.
            </div>
          </div>
          <div className={`transition-all duration-300 ${sidebarOpen ? 'sm:w-[calc(100%-16rem)] w-0' : 'w-full'} relative`}>
            {/* main content */}
            <ChatMessageList messages={messages} isReplying={isReplying} />
            <div className={`h-[8%] shadow-md border-accent rounded-md border absolute ${sidebarOpen ? "bottom-0" : "sm:bottom-0 bottom-4"} left-0 right-0`}>
              <div className="p-default gap-default bg-secondary/50 rounded-md flex gap-small items-center h-full justify-between">
                <MessageCircleCodeIcon className="text-accent" />
                <input
                  type="text"
                  className="flex-1 text-default outline-none"
                  placeholder={isWebSearchMode ? "Enter a web search query" : "Type your message..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                />
                <div className="flex gap-default">
                <button className="button" disabled={isProcessingUrl} onClick={handleSubmit}>
                  <SendIcon className="text-accent" />
                </button>
                <button
                  className={`button ${isWebSearchMode ? "bg-accent/20 border border-accent" : ""}`}
                  disabled={isProcessingUrl}
                  onClick={() => setIsWebSearchMode((prev) => !prev)}
                >
                  <Globe2Icon className={`text-accent ${isProcessingUrl ? "opacity-50" : ""}`} />
                </button>
                {/* <button className="button" onClick={()=>{}}>
                  <Mic2Icon className="text-accent" />
                </button> */}
                </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
