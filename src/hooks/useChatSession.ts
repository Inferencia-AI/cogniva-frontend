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
        const searchResponse = await api.post("/web-answer", {
          question: trimmedQuery,
        });

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

        const { promoted, wikipedia_answer, duckduckgo_answer, others } = searchResponse.data || {};
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

        if (wikipedia_answer) {
          const references = Array.isArray(wikipedia_answer.references) ? wikipedia_answer.references.filter(Boolean) : [];
          sections.push({
            type: "wikipedia",
            topic: wikipedia_answer.question || "Wikipedia",
            response: wikipedia_answer.summary,
            sources: references.map((link: string) => ({ title: link, url: link, snippet: "" } as AiSource)),
            wikipedia: wikipedia_answer,
          });
        }

        if (duckduckgo_answer && (duckduckgo_answer.answer || duckduckgo_answer.link)) {
          const link = duckduckgo_answer.link?.trim();
          sections.push({
            type: "duckduckgo",
            topic: "DuckDuckGo",
            response: duckduckgo_answer.answer,
            sources: link ? [{ title: link, url: link, snippet: "" } as AiSource] : [],
            duckduckgo: duckduckgo_answer,
          });
        }

        if (sanitizedOthers.length) {
          sections.push({ type: "others", topic: "Other sources", response: "", others: sanitizedOthers });
        }

        const summarizeSection = async (section: AiSection) => {
          const baseText =
            typeof section.response === "string"
              ? section.response
              : section.topic || "web result";

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

        await saveChat([...pendingMessages, { role: "ai", content: summarizedSections.length ? summarizedSections : [] }], selectedChatId);
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
