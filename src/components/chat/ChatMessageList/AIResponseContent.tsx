import { CodeBlock } from "react-code-block";
import ReactMarkdown from "react-markdown";
import CodeBlockRenderer from "./CodeBlockRenderer";

interface AIResponseContentProps {
  section: any;
}

/**
 * Custom code component for react-markdown to render code blocks with syntax highlighting
 */
function MarkdownCodeBlock({ className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const code = String(children).replace(/\n$/, "");

  // For inline code, just return a styled span
  if (!className) {
    return (
      <code className="px-1.5 py-0.5 bg-secondary/50 rounded text-accent text-sm font-mono" {...props}>
        {children}
      </code>
    );
  }

  // For code blocks, use the CodeBlock component
  return (
    <CodeBlock code={code} language={language}>
      <CodeBlock.Code className="overflow-auto my-2 rounded-md">
        <CodeBlock.LineContent>
          <CodeBlock.Token />
        </CodeBlock.LineContent>
      </CodeBlock.Code>
    </CodeBlock>
  );
}

export default function AIResponseContent({ section }: AIResponseContentProps) {
  const isStructuredResponse = Array.isArray(section?.response);
  const hasCodeFence = typeof section?.response === "string" && section?.response.includes("```");

  if (isStructuredResponse) {
    return (
      <div className="flex flex-col gap-small">
        {section?.response?.map((snippet: any, snippetIndex: number) => (
          <CodeBlockRenderer key={`snippet-${snippetIndex}`} snippet={snippet} />
        ))}
      </div>
    );
  }

  // If it's a string, render as markdown
  if (typeof section?.response === "string") {
    return (
      <div className="prose prose-invert prose-sm max-w-none text-default">
        <ReactMarkdown
          components={{
            // Headings
            h1: ({ children }) => <h1 className="text-xl font-bold text-default mt-4 mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold text-default mt-3 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold text-default mt-2 mb-1">{children}</h3>,
            h4: ({ children }) => <h4 className="text-sm font-semibold text-default mt-2 mb-1">{children}</h4>,
            // Paragraphs
            p: ({ children }) => <p className="text-body text-default mb-2 leading-relaxed">{children}</p>,
            // Lists
            ul: ({ children }) => <ul className="list-disc list-inside mb-2 pl-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 pl-2">{children}</ol>,
            li: ({ children }) => <li className="text-body text-default mb-1">{children}</li>,
            // Links
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
            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-accent/50 pl-4 my-2 text-default/80 italic">
                {children}
              </blockquote>
            ),
            // Code
            code: MarkdownCodeBlock,
            // Strong/Bold
            strong: ({ children }) => <strong className="font-bold text-default">{children}</strong>,
            // Emphasis/Italic
            em: ({ children }) => <em className="italic">{children}</em>,
            // Horizontal rule
            hr: () => <hr className="my-4 border-default/20" />,
            // Tables
            table: ({ children }) => (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border border-default/20 rounded">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-secondary/50">{children}</thead>,
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => <tr className="border-b border-default/10">{children}</tr>,
            th: ({ children }) => <th className="px-3 py-2 text-left text-sm font-semibold">{children}</th>,
            td: ({ children }) => <td className="px-3 py-2 text-sm">{children}</td>,
          }}
        >
          {section.response}
        </ReactMarkdown>
      </div>
    );
  }

  // Fallback for non-string, non-array responses
  return <p className="text-body whitespace-pre-line">{String(section?.response || "")}</p>;
}
