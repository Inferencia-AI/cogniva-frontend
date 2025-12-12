import { CodeBlock } from "react-code-block";
import Markdown from "react-markdown";

interface PreviewBlockProps {
  block: any;
  baseUrl?: string;
}

export default function PreviewBlock({ block, baseUrl }: PreviewBlockProps) {
  const kind = (block.blockType || "text").toLowerCase();

  if (kind === "code") {
    return (
      <div className="flex flex-col gap-2 bg-secondary/10 border border-accent/20 rounded-md p-3">
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
      <div className="flex flex-col gap-2 bg-secondary/10 border border-accent/20 rounded-md p-3">
        {block.description ? <p className="text-caption text-default/70">{block.description}</p> : null}
        <img
          src={(baseUrl || "") + block.content}
          alt={block.description || "Preview image"}
          className="max-h-96 object-contain rounded"
        />
      </div>
    );
  }

  if (kind === "link") {
    return (
      <div className="flex items-center justify-between bg-secondary/10 border border-accent/20 rounded-md p-3">
        <div className="flex flex-col min-w-0">
          {block.description ? <p className="text-caption text-default/70 truncate">{block.description}</p> : null}
          <a href={block.content} target="_blank" rel="noreferrer" className="text-secondary underline truncate">
            {block.content}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 bg-secondary/10 border border-accent/20 rounded-md p-3">
      {block.description ? <p className="text-caption text-default/70">{block.description}</p> : null}
      <Markdown>{block.content || ""}</Markdown>
    </div>
  );
}
