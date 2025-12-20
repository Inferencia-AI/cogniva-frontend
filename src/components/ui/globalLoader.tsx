import type { FC, ReactNode } from "react";

interface GlobalLoaderProps {
  fullscreen?: boolean;
  message?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeMap: Record<NonNullable<GlobalLoaderProps["size"]>, string> = {
  sm: "h-6 w-6 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-[3px]",
};

const GlobalLoader: FC<GlobalLoaderProps> = ({ fullscreen = false, message, size = "md" }) => {
  const spinnerSize = sizeMap[size];

  return (
    <div
      className={
        fullscreen
          ? "flex h-full min-h-screen w-full items-center justify-center bg-primary"
          : "flex h-full w-full items-center justify-center"
      }
    >
      <div className="flex flex-col items-center gap-3 text-default/70">
        <div
          aria-label="Loading"
          className={`animate-spin rounded-full border-default/15 border-t-accent ${spinnerSize}`}
          role="status"
        />
        {message ? <div className="text-caption text-default/60">{message}</div> : null}
      </div>
    </div>
  );
};

export default GlobalLoader;
