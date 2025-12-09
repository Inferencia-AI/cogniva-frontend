import { useCallback, useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import api from "../utils/api";
import simpleChat from "../schemas/simpleChat.json" with { type: "json" };
import codeChat from "../schemas/codeChatSchema.json" with { type: "json" };
import { auth } from "../utils/firebaseClient";
import type { ChatMessage, ChatSummary, AiSource, AiSection } from "../types/chat";

const sanitizeImages = (images: string[]) =>
  (images || [])
    .filter((src) => typeof src === "string" && /^https?:\/\//i.test(src))
    .filter(Boolean);

const safeTitle = (title: string | undefined, fallback: string) => {
  if (!title) return fallback;
  const cleaned = title.trim();
  if (!cleaned || cleaned.toLowerCase() === "no title found") return fallback;
  return cleaned;
};

export function useChatSession() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>(undefined);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [isWebSearchMode, setIsWebSearchMode] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get("/user");
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      const newToken = await getIdToken(auth.currentUser!, true);
      localStorage.setItem("token", newToken);
      window.location.reload();
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const uid = user?.user?.uid;
      if (!uid) return;
      const response = await api.get(`/chats/${uid}`);
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, [user]);

  const saveChat = useCallback(
    async (chatMessages: ChatMessage[], chatId?: number) => {
      const response = await api.post("/save-chat", {
        userId: user?.user?.uid,
        messages: chatMessages,
        chatId,
      });

      const saved = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!saved) return;

      setChats((prev) => {
        if (chatId) {
          return prev.map((chat) => (chat.id === chatId ? { ...chat, messages: chatMessages } : chat));
        }
        return [...prev, saved];
      });

      if (!chatId && saved.id) {
        setSelectedChatId(saved.id);
      }
    },
    [user],
  );

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSelectedChatId(undefined);
  }, []);

  const selectChat = useCallback((chat: ChatSummary) => {
    setSelectedChatId(chat.id);
    setMessages(chat.messages || []);
  }, []);

  const handleSendMessage = useCallback(
    async (prompt: string) => {
      const newMessages: ChatMessage[] = [...messages, { role: "human", content: prompt }];
      setMessages(newMessages);
      setIsReplying(true);

      try {
        const response = await api.post("/chat", { messages: newMessages, schema: [simpleChat, codeChat] });
        const aiPayload = (Array.isArray(response.data) ? response.data.flat() : [response.data]) as AiSection[];
        const updatedMessages: ChatMessage[] = [...newMessages, { role: "ai", content: aiPayload }];
        setMessages(updatedMessages);
        await saveChat(updatedMessages, selectedChatId);
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsReplying(false);
      }
    },
    [messages, selectedChatId, saveChat],
  );

  const handleWebSearch = useCallback(
    async (trimmedQuery: string) => {
      const pendingMessages: ChatMessage[] = [...messages, { role: "human", content: trimmedQuery }];
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

        const initialAiMessage: ChatMessage = {
          role: "ai",
          content: [
            {
              topic: `"${trimmedQuery}"`,
              response: initialAnswer,
              sources: links.map((link) => ({ title: safeTitle(undefined, link), url: link, snippet: "" } as AiSource)),
              images: initialImages,
            },
          ],
        };

        let updatedMessages: ChatMessage[] = [...pendingMessages, initialAiMessage];
        setMessages(updatedMessages);

        if (!links.length) {
          await saveChat(updatedMessages, selectedChatId);
          return;
        }

        for (const link of links) {
          try {
            const { data } = await api.get("/scrap-url", { params: { url: link } });
            const condensedHtml = typeof data?.html === "string" ? data.html.replace(/\s+/g, " ").slice(0, 2000) : "";
            const snippet = data?.description || condensedHtml.slice(0, 280) || "No content available.";
            const title = safeTitle(data?.title, link);

            const linkMessage: ChatMessage = {
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

            const errorMessage: ChatMessage = {
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

        await saveChat(updatedMessages, selectedChatId);
      } catch (error) {
        console.error("Error completing web search:", error);
        setMessages((prev) => [
          ...prev,
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
    },
    [messages, saveChat, selectedChatId],
  );

  const submitPrompt = useCallback(
    async (rawPrompt: string) => {
      if (isProcessingUrl) return;

      const trimmedInput = rawPrompt.trim();
      if (!trimmedInput) return;

      if (isWebSearchMode) {
        await handleWebSearch(trimmedInput);
      } else {
        await handleSendMessage(trimmedInput);
      }
    },
    [handleSendMessage, handleWebSearch, isProcessingUrl, isWebSearchMode],
  );

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [fetchChats, user]);

  return {
    user,
    messages,
    chats,
    selectedChatId,
    isProcessingUrl,
    isWebSearchMode,
    isReplying,
    submitPrompt,
    startNewChat,
    selectChat,
    setIsWebSearchMode,
  };
}
