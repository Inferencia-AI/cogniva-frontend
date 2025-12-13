import type { ProcessedArticle } from "../../../types/chat";
import SourceCard from "./SourceCard";

interface ArticlesAnswerProps {
  articles?: ProcessedArticle[];
}

export default function ArticlesAnswer({ articles }: ArticlesAnswerProps) {
  if (!articles || !articles.length) return null;

  // First article displayed prominently (like promoted)
  const [featuredArticle, ...restArticles] = articles;

  return (
    <div className="p-default">
      {/* Featured Article - Displayed like promoted */}
      {featuredArticle ? (
        <div className="mb-4">
          <div className="flex">
            {featuredArticle.image ? (
              <img
                className="size-20 rounded-md mr-default object-cover"
                src={featuredArticle.image}
                alt={featuredArticle.title}
              />
            ) : null}
            <div className="flex flex-col flex-1">
              <h1 className="text-heading line-clamp-2">{featuredArticle.title || "Related Article"}</h1>
              {featuredArticle.authors?.length ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By {featuredArticle.authors.slice(0, 2).join(", ")}
                  {featuredArticle.authors.length > 2 && ` +${featuredArticle.authors.length - 2} more`}
                </p>
              ) : null}
              <p className="text-body mt-1">{featuredArticle.summary}</p>
            </div>
          </div>
          {featuredArticle.url ? (
            <div className="mt-2">
              <SourceCard
                source={{ title: "Read full article", url: featuredArticle.url }}
                onOpen={(source) => window.open(source.url, "_blank")}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Rest of the articles - Compact list */}
      {restArticles.length ? (
        <>
          <p className="text-caption font-medium mb-2">More Articles ({restArticles.length})</p>
          <div className="space-y-3">
            {restArticles.map((article, index) => (
              <div
                key={`article-${index}`}
                className="flex gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-2"
              >
                {article.image ? (
                  <img
                    className="size-14 rounded-md object-cover shrink-0"
                    src={article.image}
                    alt={article.title}
                  />
                ) : null}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                    {article.title || "Untitled Article"}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">
                    {article.summary}
                  </p>
                  {article.url ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                    >
                      Read more →
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
