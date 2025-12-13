import { CodeBlock } from "react-code-block";
import CodeBlockRenderer from "./CodeBlockRenderer";

interface AIResponseContentProps {
  section: any;
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

  if (hasCodeFence) {
    return (
      <>
        {section?.response
          ?.split("```")
          .filter((_: any, i: any) => i % 2 === 1)
          ?.map((codeSegment: string, i: number) => (
            <CodeBlock key={i} code={`${codeSegment?.replace(/^[a-zA-Z]+\n/, "")}`} language="js">
              <CodeBlock.Code className="overflow-auto">
                <CodeBlock.LineContent>
                  <CodeBlock.Token />
                </CodeBlock.LineContent>
              </CodeBlock.Code>
            </CodeBlock>
          ))}
      </>
    );
  }

  return <p className="text-body whitespace-pre-line"> {section?.response}</p>;
}
