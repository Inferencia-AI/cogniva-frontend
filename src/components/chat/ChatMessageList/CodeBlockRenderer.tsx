import { CodeBlock } from "react-code-block";

interface CodeSnippet {
  text?: string;
  code: string;
  language?: string;
}

interface CodeBlockRendererProps {
  snippet: CodeSnippet;
}

export default function CodeBlockRenderer({ snippet }: CodeBlockRendererProps) {
  const snippetLanguage = typeof snippet?.language === "string" ? snippet.language.toLowerCase() : "text";

  return (
    <div className="p-small flex flex-col gap-1">
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
}
