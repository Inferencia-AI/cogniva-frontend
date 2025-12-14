import type { FC } from "react";
import ReactMarkdown from "react-markdown";

// =============================================================================
// MarkdownPreview - Renders markdown content with proper styling
// =============================================================================

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview: FC<MarkdownPreviewProps> = ({ content, className = "" }) => {
  return (
    <div className={`markdown-preview prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-default mb-4 mt-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-default mb-3 mt-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-default mb-2 mt-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-default mb-2">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-default mb-2 ml-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-default mb-2 ml-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-default mb-1">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-accent pl-4 italic text-default/80 my-2">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-secondary px-1.5 py-0.5 rounded text-accent text-sm">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-secondary p-3 rounded-md text-sm overflow-x-auto my-2">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-secondary p-3 rounded-md overflow-x-auto my-2 text-default">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full rounded-md my-2"
            />
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-default">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-default">{children}</em>
          ),
          hr: () => <hr className="border-accent my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
