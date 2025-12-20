import { useState, type FC } from "react";
import { UserPlus, Trash2, ChevronDown } from "lucide-react";
import type { Manager, ManagerRole } from "../../types/knowledgebase";

// =============================================================================
// ManagerList - Displays and manages knowledgebase managers
// =============================================================================

interface ManagerListProps {
  managers: Manager[];
  isAdmin?: boolean;
  onAddManager?: (userId: string, role: ManagerRole) => void;
  onRemoveManager?: (userId: string) => void;
  onUpdateRole?: (userId: string, role: ManagerRole) => void;
}

const roleLabels: Record<ManagerRole, string> = {
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
  approver: "Approver",
};

const roleColors: Record<ManagerRole, string> = {
  admin: "bg-red-500/20 text-red-400",
  editor: "bg-blue-500/20 text-blue-400",
  viewer: "bg-gray-500/20 text-gray-400",
  approver: "bg-green-500/20 text-green-400",
};

export const ManagerList: FC<ManagerListProps> = ({
  managers,
  isAdmin = false,
  onAddManager,
  onRemoveManager,
  onUpdateRole,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<ManagerRole>("viewer");
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const handleAddManager = () => {
    if (newUserId.trim() && onAddManager) {
      onAddManager(newUserId.trim(), newRole);
      setNewUserId("");
      setNewRole("viewer");
      setShowAddForm(false);
    }
  };

  const roles: ManagerRole[] = ["admin", "editor", "approver", "viewer"];

  return (
    <div className="bg-secondary/20 rounded-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-default">Managers</h3>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-default rounded-md text-caption font-medium hover:bg-accent/20 transition-colors"
          >
            <UserPlus className="size-4 text-default" />
            Add Manager
          </button>
        )}
      </div>

      {/* Add Manager Form */}
      {showAddForm && isAdmin && (
        <div className="mb-4 p-3 bg-primary rounded-md">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="User ID"
              className="flex-1 px-3 py-2 bg-secondary rounded-md text-default placeholder:text-default/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as ManagerRole)}
              className="px-3 py-2 bg-secondary rounded-md text-default focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 text-default/60 hover:text-default transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddManager}
              disabled={!newUserId.trim()}
              className="px-4 py-1.5 bg-accent text-primary rounded-md font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Managers List */}
      <div className="space-y-2">
        {managers.length === 0 ? (
          <p className="text-default/40 text-caption text-center py-4">
            No managers assigned
          </p>
        ) : (
          managers.map((manager) => (
            <div
              key={manager.userId}
              className="flex items-center justify-between gap-2 p-3 bg-secondary/20 rounded-md"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent text-caption font-medium">
                    {manager.userId.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-default text-body truncate" title={manager.userId}>
                  {manager.userId.length > 12 ? `${manager.userId.slice(0, 12)}...` : manager.userId}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Role Badge/Dropdown */}
                {isAdmin && editingRole === manager.userId ? (
                  <div className="relative">
                    <select
                      value={manager.role}
                      onChange={(e) => {
                        onUpdateRole?.(manager.userId, e.target.value as ManagerRole);
                        setEditingRole(null);
                      }}
                      onBlur={() => setEditingRole(null)}
                      autoFocus
                      className="px-2 py-1 bg-secondary rounded text-caption focus:outline-none"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {roleLabels[role]}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button
                    onClick={() => isAdmin && setEditingRole(manager.userId)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-caption font-medium ${
                      roleColors[manager.role]
                    } ${isAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                  >
                    {roleLabels[manager.role]}
                    {isAdmin && <ChevronDown className="size-3" />}
                  </button>
                )}

                {/* Remove Button */}
                {isAdmin && manager.role !== "admin" && (
                  <button
                    onClick={() => onRemoveManager?.(manager.userId)}
                    className="p-1.5 text-default/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
