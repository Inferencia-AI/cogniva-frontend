import { useCallback, useState, type FC, type RefObject } from "react";
import { ArrowUpRight, FileTextIcon, X } from "lucide-react";
import { CodeBlock } from "react-code-block";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { TypingIndicator } from "./TypingIndicator";
import type { ChatMessage, AiSection, AiSource } from "../../types/chat";
import api from "../../utils/api";

type SummaryBlock = {
  blockType?: string;
  description?: string;
  content?: string;
};

interface ChatMessageListProps {
  messages: ChatMessage[];
  isReplying: boolean;
  containerRef: RefObject<HTMLDivElement>;
}

export const ChatMessageList: FC<ChatMessageListProps> = ({ messages, isReplying, containerRef }) => {
  const [previewSource, setPreviewSource] = useState<AiSource | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewBlocks, setPreviewBlocks] = useState<SummaryBlock[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleOpenSource = useCallback(async (source: AiSource) => {
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
            setPreviewBlocks(blocks as SummaryBlock[]);
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
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewSource(null);
    setPreviewHtml("");
    setPreviewBlocks([]);
    setPreviewError(null);
  }, []);

  const handleOpenNewTab = useCallback((url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-[90%] overflow-y-auto absolute top-0 left-0 right-0">
      {messages.length > 0 ? (
        messages.map((msg, index) => {
          if (msg?.role === "human") {
            return (
              <div key={`msg-${index}`} className="bg-secondary/10 p-default rounded-md mb-default">
                {msg?.content as string}
              </div>
            );
          }

          const aiSections = Array.isArray(msg?.content) ? (msg.content as AiSection[]) : [msg?.content as AiSection];

          return (
            <div key={`msg-${index}`} className="flex flex-col gap-default mb-default">
              {aiSections?.filter(Boolean)?.map((section, sectionIndex) => {
                const isStructuredResponse = Array.isArray(section?.response);
                const hasCodeFence = typeof section?.response === "string" && (section.response as string).includes("```");
                const imageGallery = Array.isArray(section?.images) ? section.images.filter(Boolean) : [];

                return (
                  <div key={`section-${sectionIndex}`} className="mt-auto p-default flex flex-col gap-small">
                    <p className="text-heading">{section?.topic}</p>

                    {isStructuredResponse ? (
                      <div className="flex flex-col gap-small">
                        {section?.response?.map((snippet, snippetIndex) => {
                          const snippetLanguage = typeof snippet?.language === "string" ? snippet.language.toLowerCase() : "text";

                          return (
                            <div key={`snippet-${snippetIndex}`} className="p-small flex flex-col gap-1">
                              {snippet?.text ? <p className="text-body font-semibold">{snippet.text}</p> : null}
                              <CodeBlock code={snippet?.code || ""} language={snippetLanguage}>
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
                      (section?.response as string)
                        ?.split("```")
                        .filter((_, i) => i % 2 === 1)
                        ?.map((codeSegment, codeIndex) => (
                          <CodeBlock key={codeIndex} code={`${codeSegment?.replace(/^[a-zA-Z]+\n/, "")}`} language="js">
                            <CodeBlock.Code className="overflow-auto">
                              <CodeBlock.LineContent>
                                <CodeBlock.Token />
                              </CodeBlock.LineContent>
                            </CodeBlock.Code>
                          </CodeBlock>
                        ))
                    ) : (
                      <p className="text-body whitespace-pre-line"> {section?.response as string} </p>
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
                        <a href={section.captchaUrl} target="_blank" rel="noreferrer" className="text-accent underline text-caption">
                          Open in new tab if the frame does not load
                        </a>
                      </div>
                    ) : null}

                    {Array.isArray(section?.sources) && section.sources.length > 0 ? (
                      <div className="grid sm:grid-cols-2 grid-cols-1 gap-small">
                        {section.sources.map((source, sourceIndex) => {
                          const displayTitle = source?.title && source.title.toLowerCase() !== "no title found" ? source.title : source?.url;

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
                                <p className="text-caption text-default/70 overflow-hidden text-ellipsis">{source?.snippet || source?.url}</p>
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
                            1024: { slidesPerView: 3 },
                          }}
                          className="w-full rounded-lg overflow-hidden bg-secondary/10 border border-accent/20 h-48"
                        >
                          {imageGallery.map((imgSrc, imgIndex) => (
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
        })
      ) : (
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
                {previewBlocks.map((block, idx) => {
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
                        <img src={block.content} alt={block.description || "Preview image"} className="max-h-96 object-contain rounded" />
                      </div>
                    );
                  }

                  if (kind === "link") {
                    return (
                      <div key={idx} className="flex items-center justify-between bg-secondary/10 border border-accent/20 rounded-md p-3">
                        <div className="flex flex-col min-w-0">
                          {block.description ? <p className="text-caption text-default/70 truncate">{block.description}</p> : null}
                          <a href={block.content} target="_blank" rel="noreferrer" className="text-accent underline truncate">
                            {block.content}
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="flex flex-col gap-1 bg-secondary/10 border border-accent/20 rounded-md p-3">
                      {block.description ? <p className="text-caption text-default/70">{block.description}</p> : null}
                      <p className="text-body whitespace-pre-line">{block.content}</p>
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
  );
};
