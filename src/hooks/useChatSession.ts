import { useCallback, useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import api from "../utils/api";
import simpleChat from "../schemas/simpleChat.json" with { type: "json" };
import codeChat from "../schemas/codeChatSchema.json" with { type: "json" };
import { auth } from "../utils/firebaseClient";
import type { ChatMessage, ChatSummary, Source, AiSection, UserData, ProcessedArticle } from "../types/chat";

// =============================================================================
// Utility Functions
// =============================================================================

const sanitizeImages = (images: (string | null | undefined)[]): string[] =>
  (images || [])
    .filter((src): src is string => typeof src === "string" && /^https?:\/\//i.test(src));

const sanitizeUrl = (value?: string | null): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
};

// =============================================================================
// useChatSession Hook - Manages chat state and API interactions
// =============================================================================

export function useChatSession() {
  const [user, setUser] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>(undefined);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [isWebSearchMode, setIsWebSearchMode] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch user data from API
  // ---------------------------------------------------------------------------
  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get<UserData>("/user");
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      const newToken = await getIdToken(auth.currentUser!, true);
      localStorage.setItem("token", newToken);
      window.location.reload();
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch user's chat history
  // ---------------------------------------------------------------------------
  const fetchChats = useCallback(async () => {
    try {
      const uid = user?.user?.uid;
      if (!uid) return;
      const response = await api.get<ChatSummary[]>(`/chats/${uid}`);
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // Save chat to the database
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Chat actions
  // ---------------------------------------------------------------------------
  const startNewChat = useCallback(() => {
    setMessages([]);
    setSelectedChatId(undefined);
  }, []);

  const selectChat = useCallback((chat: ChatSummary) => {
    setSelectedChatId(chat.id);
    setMessages(chat.messages || []);
  }, []);

  const deleteChat = useCallback(async (chatId: number) => {
    try {
      await api.delete(`/chats/${chatId}`);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      // If the deleted chat was selected, clear the messages
      if (selectedChatId === chatId) {
        setMessages([]);
        setSelectedChatId(undefined);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }, [selectedChatId]);

  // ---------------------------------------------------------------------------
  // Send a regular chat message
  // ---------------------------------------------------------------------------
  const handleSendMessage = useCallback(
    async (prompt: string) => {
      const newMessages: ChatMessage[] = [...messages, { role: "human", content: prompt }];
      setMessages(newMessages);
      setIsReplying(true);

      const sections: AiSection[] = [];
      let retrievedNotes: any[] = [];

      try {
        // First, search user's notes (fast response)
        if (user?.user?.uid) {
          try {
            const notesResponse = await api.post("/search-notes", {
              userId: user.user.uid,
              query: prompt,
            });
            
            if (notesResponse.data?.notes?.length) {
              retrievedNotes = notesResponse.data.notes;
              sections.push(notesResponse.data as AiSection);
              // Update messages immediately with notes
              setMessages([...newMessages, { role: "ai", content: [...sections] }]);
            }

          } catch (notesError) {
            console.error("Error searching notes:", notesError);
            // Continue without notes
          }
        }

        // If notes were found, generate RAG-based response from notes
        if (retrievedNotes.length > 0) {
          try {
            // Construct context from retrieved notes
            const notesContext = retrievedNotes
              .map((note, index) => {
                // Strip HTML tags from body for cleaner context
                const cleanBody = note.body?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
                return `Note ${index + 1} - "${note.title}":\n${cleanBody.slice(0, 2000)}`;
              })
              .join('\n\n---\n\n');

            const ragPrompt = `Based on the following notes from the user's knowledge base, provide a comprehensive answer to their question: "${prompt}"

${notesContext}

Please synthesize the information from these notes to directly answer the user's question. If the notes don't fully answer the question, focus on what relevant information they do provide.`;

            const ragMessages: ChatMessage[] = [{ role: "human", content: ragPrompt }];
            const ragResponse = await api.post("/chat", {
              messages: ragMessages,
              schema: [simpleChat, codeChat],
            });

            const ragPayload = (Array.isArray(ragResponse.data) ? ragResponse.data.flat() : [ragResponse.data]) as AiSection[];
            
            // Mark RAG sections with a distinct topic
            const ragSections = ragPayload.map((section) => ({
              ...section,
              topic: section.topic || "From Your Notes",
            }));

            sections.push(...ragSections);
            setMessages([...newMessages, { role: "ai", content: [...sections] }]);
          } catch (ragError) {
            console.error("Error generating RAG response:", ragError);
            // Continue to general LLM response
          }
        }

        // Then, get general LLM response
        const response = await api.post("/chat", { 
          messages: newMessages, 
          schema: [simpleChat, codeChat],
        });
        const aiPayload = (Array.isArray(response.data) ? response.data.flat() : [response.data]) as AiSection[];
        
        // Combine all sections: notes + RAG response + general LLM response
        const combinedPayload = [...sections, ...aiPayload];
        const updatedMessages: ChatMessage[] = [...newMessages, { role: "ai", content: combinedPayload }];
        setMessages(updatedMessages);
        await saveChat(updatedMessages, selectedChatId);
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsReplying(false);
      }
    },
    [messages, selectedChatId, saveChat, user],
  );

  // ---------------------------------------------------------------------------
  // Web search handler - processes search results into structured sections
  // ---------------------------------------------------------------------------
  const sanitizeOtherEntry = (entry: { link?: string; data?: { images?: string[]; texts?: string[]; links?: string[] } }) => {
    const link = sanitizeUrl(entry?.link);
    const images = Array.isArray(entry?.data?.images) ? sanitizeImages(entry.data.images) : [];
    const texts = Array.isArray(entry?.data?.texts) ? entry.data.texts.filter(Boolean) : [];
    const links = Array.isArray(entry?.data?.links)
      ? entry.data.links.map(sanitizeUrl).filter((l): l is string => Boolean(l))
      : [];

    return { link, data: { images, texts, links } };
  };

  // ---------------------------------------------------------------------------
  // Individual API fetchers for progressive loading
  // ---------------------------------------------------------------------------
  const fetchPromotedAnswer = async (question: string): Promise<AiSection | null> => {
    try {
      const res = await api.post("/promoted-answer", { question });
      const { promoted } = res.data || {};
      if (!promoted) return null;

      const links = Array.isArray(promoted.links) ? promoted.links.filter(Boolean) : [];
      return {
        type: "promoted",
        topic: promoted.heading,
        response: promoted.summary,
        images: sanitizeImages(promoted.images || []),
        sources: links.map((link: string) => ({ title: link, url: link, snippet: "" } as Source)),
        promoted,
      };
    } catch {
      return null;
    }
  };

  const fetchWikipediaAnswer = async (question: string): Promise<AiSection | null> => {
    try {
      const res = await api.post("/wikipedia-answer", { question });
      const { wikipedia_answer } = res.data || {};
      if (!wikipedia_answer) return null;

      const references = Array.isArray(wikipedia_answer.references) ? wikipedia_answer.references.filter(Boolean) : [];
      return {
        type: "wikipedia",
        topic: wikipedia_answer.question || "Wikipedia",
        response: wikipedia_answer.summary,
        sources: references.map((link: string) => ({ title: link, url: link, snippet: "" } as Source)),
        wikipedia: wikipedia_answer,
      };
    } catch {
      return null;
    }
  };

  const fetchDuckDuckGoAnswer = async (question: string): Promise<AiSection | null> => {
    try {
      const res = await api.post("/duckduckgo-answer", { question });
      const { duckduckgo_answer } = res.data || {};
      if (!duckduckgo_answer || (!duckduckgo_answer.answer && !duckduckgo_answer.link)) return null;

      const link = duckduckgo_answer.link?.trim();
      return {
        type: "duckduckgo",
        topic: "DuckDuckGo",
        response: duckduckgo_answer.answer,
        sources: link ? [{ title: link, url: link, snippet: "" } as Source] : [],
        duckduckgo: duckduckgo_answer,
      };
    } catch {
      return null;
    }
  };

  const fetchOthersAnswer = async (question: string): Promise<AiSection | null> => {
    try {
      const res = await api.post("/others-answer", { question });
      const { others } = res.data || {};
      if (!Array.isArray(others) || !others.length) return null;

      const sanitizedOthers = others.map(sanitizeOtherEntry);
      return { type: "others", topic: "Other sources", response: "", others: sanitizedOthers };
    } catch {
      return null;
    }
  };

  const fetchArticlesAnswer = async (question: string): Promise<AiSection | null> => {
    try {
      // Fetch raw articles with images
      const res = await api.post("/articles-answer", { question });
      const { articles, images } = res.data || {};
      if (!Array.isArray(articles) || !articles.length) return null;

      // Sanitize fetched images
      const fetchedImages = sanitizeImages(images || []);

      // Use AI to extract relevant information from each article
      const processedArticles: ProcessedArticle[] = [];
      let imageIndex = 0;

      for (const article of articles.slice(0, 5)) { // Limit to 5 articles
        if (!article.text || article.text.length < 50) continue;

        try {
          const extractionPrompt = `You are an information extractor. The user asked: "${question}"

Here is an article titled "${article.title || 'Untitled'}":
${article.text.slice(0, 2000)}

Extract ONLY the information that directly answers or relates to the user's question. Ignore any unrelated information. If the article doesn't contain relevant information to the question, respond with "NOT_RELEVANT".

Provide a concise 2-3 sentence summary of the relevant information only.`;

          const aiRes = await api.post("/chat", {
            messages: [{ role: "human", content: extractionPrompt }],
            schema: [simpleChat],
          });

          const aiPayload = Array.isArray(aiRes.data) ? aiRes.data.flat() : [aiRes.data];
          const first = aiPayload[0];
          let summary = "";

          if (typeof first === "string") {
            summary = first;
          } else if (first?.response) {
            summary = typeof first.response === "string" 
              ? first.response 
              : Array.isArray(first.response) 
                ? first.response.map((s: { text?: string }) => s?.text || "").join(" ") 
                : "";
          }

          // Skip if AI determined it's not relevant
          if (summary.includes("NOT_RELEVANT") || summary.length < 20) continue;

          // Assign an image to this article from the fetched images
          const articleImage = fetchedImages[imageIndex] || undefined;
          if (articleImage) imageIndex++;

          processedArticles.push({
            url: article.url,
            title: article.title,
            summary,
            authors: article.authors,
            published_date: article.published_date,
            image: articleImage,
          });
        } catch {
          // Skip articles that fail to process
          continue;
        }
      }

      if (!processedArticles.length) return null;

      return {
        type: "articles",
        topic: "Related Articles",
        response: `Found ${processedArticles.length} relevant articles`,
        sources: processedArticles.map((a) => ({ title: a.title, url: a.url, snippet: a.summary } as Source)),
        articles: processedArticles,
        images: fetchedImages,
      };
    } catch {
      return null;
    }
  };

  const handleWebSearch = useCallback(
    async (trimmedQuery: string) => {
      const pendingMessages: ChatMessage[] = [...messages, { role: "human", content: trimmedQuery }];
      setMessages(pendingMessages);
      setIsProcessingUrl(true);
      setIsReplying(true);

      const sections: AiSection[] = [];

      const updateMessagesWithSections = (newSections: AiSection[]) => {
        setMessages([...pendingMessages, { role: "ai", content: [...newSections] }]);
      };

      try {
        // Fetch promoted answer first (fastest, special case)
        const promotedSection = await fetchPromotedAnswer(trimmedQuery);
        if (promotedSection) {
          sections.push(promotedSection);
          updateMessagesWithSections(sections);
        }

        // Fetch articles early (displayed prominently like promoted)
        const articlesSection = await fetchArticlesAnswer(trimmedQuery);
        if (articlesSection) {
          sections.push(articlesSection);
          updateMessagesWithSections(sections);
        }

        // Fetch Wikipedia and DuckDuckGo in parallel
        const [wikipediaSection, duckduckgoSection] = await Promise.all([
          fetchWikipediaAnswer(trimmedQuery),
          fetchDuckDuckGoAnswer(trimmedQuery),
        ]);

        if (wikipediaSection) {
          sections.push(wikipediaSection);
          updateMessagesWithSections(sections);
        }

        if (duckduckgoSection) {
          sections.push(duckduckgoSection);
          updateMessagesWithSections(sections);
        }

        // Fetch others last (slowest)
        const othersSection = await fetchOthersAnswer(trimmedQuery);

        if (othersSection) {
          sections.push(othersSection);
          updateMessagesWithSections(sections);
        }

        // If no results were found
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

        await saveChat([...pendingMessages, { role: "ai", content: sections.length ? sections : [] }], selectedChatId);
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
    deleteChat,
    setIsWebSearchMode,
  };
}
