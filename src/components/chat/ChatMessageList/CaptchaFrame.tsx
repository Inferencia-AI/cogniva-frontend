interface CaptchaFrameProps {
  url?: string;
}

export default function CaptchaFrame({ url }: CaptchaFrameProps) {
  if (!url) return null;

  return (
    <div className="flex flex-col gap-small">
      <iframe
        src={url}
        title="DuckDuckGo Captcha"
        className="w-full h-96 rounded-md border border-accent"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        loading="lazy"
      />
      <a href={url} target="_blank" rel="noreferrer" className="text-accent underline text-caption">
        Open in new tab if the frame does not load
      </a>
    </div>
  );
}
