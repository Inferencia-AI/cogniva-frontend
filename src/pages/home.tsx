import { useEffect, useState } from "react";
import api from "../utils/api";
import simpleChat from "../schemas/simpleChat.json" with { type: "json" };
import codeChat from "../schemas/codeChatSchema.json" with { type: "json" };
import { FileTextIcon, Globe2Icon, MessageCircleCodeIcon, Mic2Icon, SendIcon, SidebarClose, SidebarOpenIcon } from 'lucide-react'
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import { CodeBlock } from 'react-code-block';


function TypingIndicator() {
  return (
    <div className="typing-indicator flex items-center gap-small">
      <MessageCircleCodeIcon className="text-accent" />
      <div className="flex items-center gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="text-caption text-default">Assistant is typing</span>
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

    const humanMessage = `${trimmedQuery}`;
    const pendingMessages = [...messages, { role: "human", content: humanMessage }];
    setMessages(pendingMessages);
    setIsProcessingUrl(true);
    setIsReplying(true);

    try {
      const searchResponse = await api.get("/search", { params: { q: trimmedQuery } });
      const links: string[] = searchResponse.data?.links || [];

      if (!links.length) {
        setMessages([
          ...pendingMessages,
          { role: "ai", content: [{ topic: "Web search", response: "No sources found for that query." }] }
        ]);
        return;
      }

      const scrapedSources = await Promise.all(
        links.map(async (link) => {
          try {
            const { data } = await api.get("/scrap-url", { params: { url: link } });
            const condensedHtml = typeof data?.html === "string" ? data.html.replace(/\s+/g, " ").slice(0, 2000) : "";
            const snippet = data?.description || condensedHtml.slice(0, 280);

            return {
              url: link,
              title: data?.title || link,
              description: data?.description || "",
              snippet,
              content: condensedHtml
            };
          } catch (error) {
            console.error("Error scraping link:", link, error);
            return null;
          }
        })
      );

      const validSources = scrapedSources.filter(Boolean) as {
        url: string;
        title: string;
        description: string;
        snippet: string;
        content: string;
      }[];

      if (!validSources.length) {
        setMessages([
          ...pendingMessages,
          { role: "ai", content: [{ topic: "Web search", response: "Unable to fetch any sources. Please try again." }] }
        ]);
        return;
      }

      const contextPrompt = `You searched for "${trimmedQuery}". You crawled several sources and extracted condensed HTML/text. Create a concise, human-readable synthesis that answers the query, highlights key points, and keeps wording natural. Respond as JSON array of sections where each section has: topic (string), response (string or array of code snippets as in prior schema), and sources (array of {title, url, snippet}). Use the provided sources and do not fabricate URLs. Sources: ${JSON.stringify(
        validSources.map(({ url, title, description, snippet, content }) => ({
          url,
          title,
          description,
          snippet,
          content
        }))
      )}`;

      const response = await api.post("/chat", {
        messages: [...pendingMessages, { role: "human", content: contextPrompt }],
        schema: [simpleChat, codeChat]
      });

      const aiPayloadRaw = Array.isArray(response.data) ? response.data.flat() : [response.data];
      const enrichedPayload = aiPayloadRaw.map((section: any) => ({
        ...section,
        sources: validSources.map(({ title, url, snippet }) => ({ title, url, snippet }))
      }));

      const updatedMessages = [...pendingMessages, { role: "ai", content: enrichedPayload }];
      setMessages(updatedMessages);

      const savedChat = await api.post("/save-chat", { userId: user?.user?.uid, messages: updatedMessages, chatId: selectedChat });
      if (!selectedChat) {
        setChats([...chats, savedChat.data[0]]);
        setSelectedChat(savedChat.data[0].id);
      }
    } catch (error) {
      console.error("Error completing web search:", error);
      setMessages([
        ...pendingMessages,
        { role: "ai", content: [{ topic: "Web search", response: "Sorry, I couldn't complete that search. Please try again." }] }
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
            <div className="overflow-y-auto h-[80%] p-default flex flex-col gap-default bg-secondary/10 rounded-md scrollbar-thin  " dir="rtl"> 
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
            <div className="flex flex-col h-[90%] overflow-y-auto absolute top-0 left-0 right-0">
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

                          {Array.isArray(section?.sources) && section.sources.length > 0 ? (
                            <div className="grid sm:grid-cols-2 grid-cols-1 gap-small">
                              {section.sources.map((source: any, sourceIndex: number) => (
                                <a
                                  key={`source-${sourceIndex}`}
                                  href={source?.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-start gap-small p-small rounded-md bg-secondary/20 border border-accent/40 hover:border-accent transition"
                                >
                                  <FileTextIcon className="text-accent shrink-0" />
                                  <div className="flex flex-col overflow-hidden">
                                    <p className="text-body font-semibold truncate">{source?.title || source?.url}</p>
                                    <p className="text-caption text-default/70 overflow-hidden text-ellipsis">
                                      {source?.snippet || source?.url}
                                    </p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          ) : null}

                          {section?.date ? <p className="text-caption"> {section?.date} </p> : null}
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
                  placeholder={isWebSearchMode ? "Enter a URL to summarize" : "Type your message..."}
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
                <button className="button" onClick={()=>{}}>
                  <Mic2Icon className="text-accent" />
                </button>
                </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
