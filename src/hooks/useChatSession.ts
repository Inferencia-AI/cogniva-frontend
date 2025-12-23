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
  const [lastQuery, setLastQuery] = useState<string>("");


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
    // Set lastQuery from the last human message in the loaded chat
    const lastHuman = [...(chat.messages || [])].reverse().find(m => m.role === "human");
    if (lastHuman && typeof lastHuman.content === "string") {
      setLastQuery(lastHuman.content);
    }
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
  // Flow: First search notes/knowledgebases -> Use LLM with context if found
  // -> Only use LLM's own knowledge when user explicitly requests it
  // ---------------------------------------------------------------------------
  const handleSendMessage = useCallback(
    async (prompt: string, forceExternalKnowledge = false) => {
      // When forcing external knowledge, we don't add a new human message
      // We just append the AI response to the existing conversation
      const newMessages: ChatMessage[] = forceExternalKnowledge 
        ? [...messages] 
        : [...messages, { role: "human", content: prompt }];
      
      if (!forceExternalKnowledge) {
        setMessages(newMessages);
      }
      setIsReplying(true);

      const sections: AiSection[] = [];
      let retrievedNotes: any[] = [];
      let retrievedCorpus: any[] = [];
      let answerSource: "notes" | "corpus" | "both" | "external" | null = null;

      try {
        // Skip searching notes/corpus if user wants external knowledge
        if (!forceExternalKnowledge && user?.user?.uid) {
          // Search user's notes and subscribed knowledgebases' corpus in parallel
          const [notesResult, corpusResult] = await Promise.allSettled([
            // Search user's personal notes
            api.post("/search-notes", {
              userId: user.user.uid,
              query: prompt,
            }),
            // Search corpus from subscribed knowledgebases
            api.post("/corpus/query-subscribed", {
              user_id: user.user.uid,
              question: prompt,
            }),
          ]);

          // Process notes result
          if (notesResult.status === "fulfilled" && notesResult.value.data?.notes?.length) {
            retrievedNotes = notesResult.value.data.notes;
            sections.push(notesResult.value.data as AiSection);
          }

          // Process corpus result
          if (corpusResult.status === "fulfilled" && corpusResult.value.data?.corpus?.length) {
            retrievedCorpus = corpusResult.value.data.corpus;
            sections.push(corpusResult.value.data as AiSection);
          }

          // Determine answer source
          if (retrievedNotes.length > 0 && retrievedCorpus.length > 0) {
            answerSource = "both";
          } else if (retrievedNotes.length > 0) {
            answerSource = "notes";
          } else if (retrievedCorpus.length > 0) {
            answerSource = "corpus";
          }

          // Update messages immediately with notes and corpus
          if (sections.length > 0) {
            setMessages([...newMessages, { role: "ai", content: [...sections] }]);
          }
        }

        // Generate RAG-based response if we have context from notes or corpus
        const hasContext = retrievedNotes.length > 0 || retrievedCorpus.length > 0;

        if (hasContext && !forceExternalKnowledge) {
          try {
            // Construct context from retrieved notes
            const notesContext = retrievedNotes
              .map((note, index) => {
                const cleanBody = note.body?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";
                return `Personal Note ${index + 1} - "${note.title}":\n${cleanBody.slice(0, 1500)}`;
              })
              .join("\n\n---\n\n");

            // Construct context from retrieved corpus
            const corpusContext = retrievedCorpus
              .map((item, index) => {
                const cleanBody = item.body?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";
                const keywords = item.keywords?.length ? `Keywords: ${item.keywords.join(", ")}` : "";
                return `Knowledge Article ${index + 1} - "${item.title}" (from ${item.knowledgebaseName}):\n${keywords}\n${cleanBody.slice(0, 1500)}`;
              })
              .join("\n\n---\n\n");

            // Combine both contexts
            const combinedContext = [notesContext, corpusContext].filter(Boolean).join("\n\n==========\n\n");

            const ragPrompt = `Based ONLY on the following knowledge sources, provide a comprehensive answer to the user's question: "${prompt}"

${combinedContext}

IMPORTANT: Answer ONLY using the information from these sources. Do not use any external knowledge. If the sources don't contain enough information to fully answer the question, clearly state what information is available and what is missing.`;

            const ragMessages: ChatMessage[] = [{ role: "human", content: ragPrompt }];
            const ragResponse = await api.post("/chat", {
              messages: ragMessages,
              schema: [simpleChat, codeChat],
            });

            const ragPayload = (Array.isArray(ragResponse.data) ? ragResponse.data.flat() : [ragResponse.data]) as AiSection[];

            // Mark RAG sections with a distinct topic based on sources
            const ragTopic =
              retrievedCorpus.length > 0 && retrievedNotes.length > 0
                ? "From Your Knowledge Sources"
                : retrievedCorpus.length > 0
                  ? "From Your Knowledgebases"
                  : "From Your Notes";

            const ragSections = ragPayload.map((section) => ({
              ...section,
              topic: section.topic || ragTopic,
              answerSource: answerSource,
              showExpandButton: true,
            }));

            sections.push(...ragSections);
            setMessages([...newMessages, { role: "ai", content: [...sections] }]);

            // Save and return - don't query external LLM when we have context
            await saveChat([...newMessages, { role: "ai", content: [...sections] }], selectedChatId);
            return;
          } catch (ragError) {
            console.error("Error generating RAG response:", ragError);
            // Continue to general LLM response as fallback
          }
        }

        // Only get general LLM response if:
        // 1. No context was found from notes/corpus OR
        // 2. User explicitly requested external knowledge
        const response = await api.post("/chat", {
          messages: forceExternalKnowledge 
            ? [{ role: "human", content: prompt }] 
            : newMessages,
          schema: [simpleChat, codeChat],
        });
        const aiPayload = (Array.isArray(response.data) ? response.data.flat() : [response.data]) as AiSection[];

        // Mark as external knowledge if user forced it
        const llmSections = aiPayload.map((section) => ({
          ...section,
          topic: forceExternalKnowledge ? "From AI Knowledge" : section.topic,
          answerSource: "external" as const,
        }));

        let updatedMessages: ChatMessage[];
        
        if (forceExternalKnowledge) {
          // Append external knowledge to the last AI message
          const lastMessageIndex = messages.length - 1;
          const lastMessage = messages[lastMessageIndex];
          
          if (lastMessage && lastMessage.role === "ai" && Array.isArray(lastMessage.content)) {
            // Remove showExpandButton from existing sections and add new external sections
            const updatedContent = [
              ...lastMessage.content.map(section => ({ ...section, showExpandButton: false })),
              ...llmSections
            ];
            updatedMessages = [
              ...messages.slice(0, lastMessageIndex),
              { role: "ai" as const, content: updatedContent }
            ];
          } else {
            // Fallback: just add the external sections as a new AI message
            updatedMessages = [...messages, { role: "ai" as const, content: llmSections }];
          }
        } else {
          // Normal flow: combine all sections
          const combinedPayload = [...sections, ...llmSections];
          updatedMessages = [...newMessages, { role: "ai", content: combinedPayload }];
        }
        
        setMessages(updatedMessages);
        await saveChat(updatedMessages, selectedChatId);
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsReplying(false);
      }
    },
    [messages, selectedChatId, saveChat, user]
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
    [messages, saveChat, selectedChatId]
  );

  // ---------------------------------------------------------------------------
  // Submit prompt handler - routes to appropriate handler based on mode
  // ---------------------------------------------------------------------------
  const submitPrompt = useCallback(
    async (rawPrompt: string, forceExternalKnowledge = false) => {
      if (isProcessingUrl) return;

      const trimmedInput = rawPrompt.trim();
      if (!trimmedInput) return;

      setLastQuery(trimmedInput);

      if (isWebSearchMode) {
        await handleWebSearch(trimmedInput);
      } else {
        await handleSendMessage(trimmedInput, forceExternalKnowledge);
      }
    },
    [handleSendMessage, handleWebSearch, isProcessingUrl, isWebSearchMode]
  );

  // ---------------------------------------------------------------------------
  // Expand to external knowledge - called when user clicks the expand button
  // ---------------------------------------------------------------------------
  const expandToExternalKnowledge = useCallback(
    async (query?: string | React.MouseEvent) => {
      // Ignore if query is an event object (from button click)
      const providedQuery = typeof query === "string" ? query : undefined;
      
      // Find the last human message in the conversation
      const lastHumanMessage = [...messages].reverse().find(m => m.role === "human");
      const queryToUse = providedQuery || lastQuery || (typeof lastHumanMessage?.content === "string" ? lastHumanMessage.content : "");
      
      if (!queryToUse) {
        console.error("No query found for external knowledge expansion");
        return;
      }
      
      await handleSendMessage(queryToUse, true);
    },
    [handleSendMessage, lastQuery, messages]
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
    expandToExternalKnowledge,
    lastQuery,
  };
}
