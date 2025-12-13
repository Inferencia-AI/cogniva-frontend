import type { FC } from "react";
import type { UserData } from "../../types/chat";

interface ChatHeaderProps {
  user: UserData | null;
  profileMenuOpen: boolean;
  onToggleProfileMenu: () => void;
  onSignOut: () => void;
}

export const ChatHeader: FC<ChatHeaderProps> = ({ user, profileMenuOpen, onToggleProfileMenu, onSignOut }) => {
  return (
    <div className="flex p-default items-center justify-between border-b border-accent shadow-md">
      <div className="flex items-center gap-default">
        <img onClick={onToggleProfileMenu} src={user?.user?.picture} className="rounded-full size-12 cursor-pointer" alt="User Avatar" />
        <div className="sm:block hidden">
          <p className="text-default text-body">{user?.user?.name}</p>
          <p className="text-default text-caption">{user?.user?.email}</p>
        </div>

        <div
          className={`transition-all duration-300 ${profileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"} absolute top-16 left-4 bg-secondary shadow-md rounded-md flex flex-col gap-default`}
        >
          <button className="button" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <img src="/cogniva-landscape-logo.svg" className="h-20" alt="Cogniva Logo" />
    </div>
  );
};
