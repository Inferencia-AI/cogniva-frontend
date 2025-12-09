import { useEffect, useRef, useState } from "react";
import api from "../utils/api";
import simpleChat from "../schemas/simpleChat.json" with { type: "json" };
import codeChat from "../schemas/codeChatSchema.json" with { type: "json" };
import { ArrowUpRight, FileTextIcon, Globe2Icon, MessageCircleCodeIcon, 
  // Mic2Icon,
   SendIcon, SidebarClose, SidebarOpenIcon, X } from 'lucide-react'
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import { CodeBlock } from 'react-code-block';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Markdown from "react-markdown";


function TypingIndicator() {
  return (
    <div className="typing-indicator flex items-center gap-small">
      <MessageCircleCodeIcon className="text-accent" />
      <div className="flex items-center gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="text-caption text-default">Cogniva Responding</span>
    </div>
  );
}


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
  const [previewSource, setPreviewSource] = useState<any>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewBlocks, setPreviewBlocks] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

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

    const safeTitle = (title: string | undefined, fallback: string) => {
      if (!title) return fallback;
      const cleaned = title.trim();
      if (!cleaned || cleaned.toLowerCase() === "no title found") return fallback;
      return cleaned;
    };

    const sanitizeImages = (images: string[]) =>
      (images || []).filter((src) => typeof src === "string" && /^https?:\/\//i.test(src)).filter(Boolean);

    const humanMessage = `${trimmedQuery}`;
    const pendingMessages = [...messages, { role: "human", content: humanMessage }];
    setMessages(pendingMessages);
    setIsProcessingUrl(true);
    setIsReplying(true);

    try {
      const searchResponse = await api.get("/search", { params: { q: trimmedQuery } });
      const links: string[] = Array.isArray(searchResponse.data?.links)
        ? searchResponse.data.links.filter(Boolean)
        : [];
      const initialImages: string[] = Array.isArray(searchResponse.data?.images)
        ? sanitizeImages(searchResponse.data.images)
        : [];
      const initialAnswer = searchResponse.data?.answer || "Here is what I found.";

      const initialAiMessage = {
        role: "ai",
        content: [
          {
            topic: `"${trimmedQuery}"`,
            response: initialAnswer,
            sources: links.map((link) => ({ title: safeTitle(undefined, link), url: link, snippet: "" })),
            images: initialImages,
          },
        ],
      };

      let updatedMessages = [...pendingMessages, initialAiMessage];
      setMessages(updatedMessages);

      if (!links.length) {
        const savedChat = await api.post("/save-chat", {
          userId: user?.user?.uid,
          messages: updatedMessages,
          chatId: selectedChat,
        });

        if (!selectedChat) {
          setChats([...chats, savedChat.data[0]]);
          setSelectedChat(savedChat.data[0].id);
        }

        return;
      }

      for (const link of links) {
        try {
          const { data } = await api.get("/scrap-url", { params: { url: link } });
          const condensedHtml = typeof data?.html === "string" ? data.html.replace(/\s+/g, " ").slice(0, 2000) : "";
          const snippet = data?.description || condensedHtml.slice(0, 280) || "No content available.";
          const title = safeTitle(data?.title, link);

          const linkMessage = {
            role: "ai",
            content: [
              {
                topic: title,
                response: snippet,
                sources: [{ title, url: link, snippet }],
                images: Array.isArray(data?.images) ? sanitizeImages(data.images) : [],
              },
            ],
          };

          updatedMessages = [...updatedMessages, linkMessage];
          setMessages(updatedMessages);
        } catch (error) {
          console.error("Error scraping link:", link, error);

          const errorMessage = {
            role: "ai",
            content: [
              {
                topic: "",
                response: `${link}`,
                sources: [{ title: link, url: link, snippet: "" }],
              },
            ],
          };

          updatedMessages = [...updatedMessages, errorMessage];
          setMessages(updatedMessages);
        }
      }

      const savedChat = await api.post("/save-chat", {
        userId: user?.user?.uid,
        messages: updatedMessages,
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
        { role: "ai", content: [{ topic: `Search error for "${trimmedQuery}"`, response: "Sorry, I couldn't complete that search. Please try again." }] }
      ]);
    } finally {
      setIsProcessingUrl(false);
      setIsReplying(false);
    }
  };

  const handleOpenSource = async (source: any) => {
    if (!source?.url) return;

    setPreviewSource(source);
    setPreviewHtml("");
    setPreviewBlocks([]);
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const { data } = await api.get("/scrap-url", { params: { url: source.url } });
      const rawHtml = typeof data?.html === "string" ? data.html : "";
      const fallback = typeof data?.description === "string" ? `<p class=\"p-4 text-body\">${data.description}</p>` : "";

      if (rawHtml) {
        try {
          const { data: summary } = await api.post("/summarize-html", { htmlContent: rawHtml });
          const blocks = Array.isArray(summary) ? summary.filter(Boolean) : [];
          if (blocks.length) {
            setPreviewBlocks(blocks);
            setPreviewHtml("");
          } else {
            setPreviewHtml(rawHtml);
          }
        } catch (summaryError) {
          console.error("Error summarizing source preview:", summaryError);
          setPreviewHtml(rawHtml);
          setPreviewError("Unable to summarize. Showing raw preview.");
        }
      } else {
        setPreviewHtml(fallback || "<p class=\"p-4 text-body\">No preview content available.</p>");
      }
    } catch (error) {
      console.error("Error fetching source preview:", error);
      setPreviewError("Unable to load preview. Use the Open page link.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewSource(null);
    setPreviewHtml("");
    setPreviewBlocks([]);
    setPreviewError(null);
  };

  const handleOpenNewTab = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  
  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isReplying]);
  

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
            <div
              ref={messagesContainerRef}
              className="flex flex-col h-[90%] overflow-y-auto absolute top-0 left-0 right-0"
            >
              {messages.length > 0 ? messages.map((msg: any, index: number) => {
                if (msg?.role === "human") {
                  return (
                    <div key={`msg-${index}`} className="bg-secondary/10 p-default rounded-md mb-default">
                      {msg?.content}
                    </div>
                  );
                }

                const aiSections = Array.isArray(msg?.content) ? msg.content : [msg?.content];

                return (
                  <div key={`msg-${index}`} className="flex flex-col gap-default mb-default">
                    {aiSections?.filter(Boolean)?.map((section: any, sectionIndex: number) => {
                      const isStructuredResponse = Array.isArray(section?.response);
                      const hasCodeFence = typeof section?.response === "string" && section?.response.includes("```");
                      const imageGallery = Array.isArray(section?.images) ? section.images.filter(Boolean) : [];

                      return (
                        <div key={`section-${sectionIndex}`} className="mt-auto p-default flex flex-col gap-small">
                          <p className="text-heading">{section?.topic}</p>

                          {isStructuredResponse ? (
                            <div className="flex flex-col gap-small">
                              {section?.response?.map((snippet: any, snippetIndex: number) => {
                                const snippetLanguage = typeof snippet?.language === "string" ? snippet.language.toLowerCase() : "text";

                                return (
                                  <div key={`snippet-${snippetIndex}`} className="p-small flex flex-col gap-1">
                                    {snippet?.text ? <p className="text-body font-semibold">{snippet.text}</p> : null}
                                    <CodeBlock
                                      code={snippet?.code || ""}
                                      language={snippetLanguage}
                                    >
                                      <CodeBlock.Code className="overflow-auto">
                                        <CodeBlock.LineContent>
                                          <CodeBlock.Token />
                                        </CodeBlock.LineContent>
                                      </CodeBlock.Code>
                                    </CodeBlock>
                                  </div>
                                );
                              })}
                            </div>
                          ) : hasCodeFence ? (
                            section?.response
                              ?.split("```")
                              .filter((_: any, i: any) => i % 2 === 1)
                              ?.map((codeSegment: string, i: number) => (
                                <CodeBlock
                                  key={i}
                                  code={`${codeSegment?.replace(/^[a-zA-Z]+\n/, "")}`}
                                  language="js"
                                >
                                  <CodeBlock.Code className="overflow-auto">
                                    <CodeBlock.LineContent>
                                      <CodeBlock.Token />
                                    </CodeBlock.LineContent>
                                  </CodeBlock.Code>
                                </CodeBlock>
                              ))
                          ) : (
                            <p className="text-body whitespace-pre-line"> {section?.response} </p>
                          )}

                          {section?.captchaUrl ? (
                            <div className="flex flex-col gap-small">
                              <iframe
                                src={section.captchaUrl}
                                title="DuckDuckGo Captcha"
                                className="w-full h-96 rounded-md border border-accent"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                                loading="lazy"
                              />
                              <a
                                href={section.captchaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-accent underline text-caption"
                              >
                                Open in new tab if the frame does not load
                              </a>
                            </div>
                          ) : null}

                          {Array.isArray(section?.sources) && section.sources.length > 0 ? (
                            <div className="grid sm:grid-cols-2 grid-cols-1 gap-small">
                              {section.sources.map((source: any, sourceIndex: number) => {
                                const displayTitle = source?.title && source.title.toLowerCase() !== "no title found"
                                  ? source.title
                                  : source?.url;

                                return (
                                  <button
                                    type="button"
                                    key={`source-${sourceIndex}`}
                                    onClick={() => handleOpenSource(source)}
                                    className="flex items-start gap-small p-small rounded-md bg-secondary/20 border border-accent/40 hover:border-accent transition text-left w-full"
                                    disabled={!source?.url}
                                  >
                                    <FileTextIcon className="text-accent shrink-0" />
                                    <div className="flex flex-col overflow-hidden">
                                      <p className="text-body font-semibold truncate">{displayTitle}</p>
                                      <p className="text-caption text-default/70 overflow-hidden text-ellipsis">
                                        {source?.snippet || source?.url}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}

                          {section?.date ? <p className="text-caption"> {section?.date} </p> : null}

                          {imageGallery.length ? (
                            <div className="pt-small">
                              <Swiper
                                modules={[Navigation, Pagination]}
                                slidesPerView={1}
                                spaceBetween={12}
                                navigation
                                pagination={{ clickable: true }}
                                breakpoints={{
                                  640: { slidesPerView: 2 },
                                  1024: { slidesPerView: 3 }
                                }}
                                className="w-full rounded-lg overflow-hidden bg-secondary/10 border border-accent/20 h-48"
                              >
                                {imageGallery.map((imgSrc: string, imgIndex: number) => (
                                  <SwiperSlide key={`img-${imgIndex}`} className="w-full h-full">
                                    <div className="w-full h-full flex items-center justify-center bg-primary">
                                      <img
                                        src={imgSrc}
                                        alt={`Source ${imgIndex + 1}`}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                        }}
                                        loading="lazy"
                                      />
                                    </div>
                                  </SwiperSlide>
                                ))}
                              </Swiper>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              }):(
                <div className="flex-1 flex flex-col justify-center items-center">
                  <p className="text-default text-heading">Welcome to Cogniva Chat!</p>
                  <p className="text-default/50 text-body">Start a new chat by typing a message below.</p>
                </div>
              )}
              {messages.length > 0 && isReplying ? (
                <div className="mb-default">
                  <TypingIndicator />
                </div>
              ) : null}
            </div>
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

        {previewSource ? (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-secondary/90 border-b border-accent/30">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-2 rounded-md bg-secondary/60 hover:bg-secondary/80 border border-accent/30 text-default"
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">Close preview</span>
                </button>
                <div className="flex flex-col min-w-0">
                  <p className="text-body font-semibold truncate">{previewSource?.title || previewSource?.url}</p>
                  <p className="text-caption text-default/70 truncate">{previewSource?.url}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewTab(previewSource?.url)}
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-body">Open page</span>
              </button>
            </div>

            <div className="flex-1 m-4 bg-primary border border-accent/20 rounded-lg overflow-hidden min-h-0">
              {isPreviewLoading ? (
                <div className="h-full w-full flex items-center justify-center text-default">Loading preview…</div>
              ) : previewBlocks.length ? (
                <div className="h-full w-full overflow-y-auto p-4 flex flex-col gap-4">
                  {previewBlocks.map((block: any, idx: number) => {
                    const kind = (block.blockType || "text").toLowerCase();

                    if (kind === "code") {
                      return (
                        <div key={idx} className="flex flex-col gap-2 bg-secondary/10 border border-accent/20 rounded-md p-3">
                          {block.description ? <p className="text-caption text-default/70">{block.description}</p> : null}
                          <CodeBlock code={block.content || ""} language="javascript">
                            <CodeBlock.Code className="overflow-auto">
                              <CodeBlock.LineContent>
                                <CodeBlock.Token />
                              </CodeBlock.LineContent>
                            </CodeBlock.Code>
                          </CodeBlock>
                        </div>
                      );
                    }

                    if (kind === "image") {
                      return (
                        <div key={idx} className="flex flex-col gap-2 bg-secondary/10 border border-accent/20 rounded-md p-3">
                          {block.description ? <p className="text-caption text-default/70">{block.description}</p> : null}
                          <img src={
                            previewSource?.url +
                            block.content} 
                            alt={block.description || "Preview image"} className="max-h-96 object-contain rounded" />
                        </div>
                      );
                    }

                    if (kind === "link") {
                      return (
                        <div key={idx} className="flex items-center justify-between bg-secondary/10 border border-accent/20 rounded-md p-3">
                          <div className="flex flex-col min-w-0">
                            {block.description ? <p className="text-caption text-default/70 truncate">{block.description}</p> : null}
                            <a href={block.content} target="_blank" rel="noreferrer" className="text-secondary underline truncate">
                              {block.content}
                            </a>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="flex flex-col gap-1 bg-secondary/10 border border-accent/20 rounded-md p-3">
                         {block.description ? <p className="text-caption text-default/70">{block.description}</p> : null}
                        {/* <p className="text-body whitespace-pre-line">{block.content}</p>  */}
                        <Markdown>
                          {block.content || ""}
                        </Markdown>
                      </div>
                    );
                  })}
                </div>
              ) : previewError ? (
                <div className="h-full w-full flex items-center justify-center px-6 text-default text-center">{previewError}</div>
              ) : (
                <iframe
                  title={previewSource?.title || previewSource?.url || "Source preview"}
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                  className="w-full h-full bg-white"
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
