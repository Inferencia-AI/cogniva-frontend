interface HumanMessageProps {
  content: string;
}

export default function HumanMessage({ content }: HumanMessageProps) {
  return (
    <div className="bg-secondary/10 p-default rounded-md mb-default">
      {content}
    </div>
  );
}
