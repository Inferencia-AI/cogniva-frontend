import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  KnowledgebaseHeader,
  ManagerList,
  CorpusList,
} from "../../components/knowledgebase";
import { useKnowledgebaseContext } from "../../context/KnowledgebaseContext";
import GlobalLoader from "../../components/ui/globalLoader";
import type { ManagerRole } from "../../types/knowledgebase";

// =============================================================================
// Knowledgebase Detail Page
// =============================================================================

export default function KnowledgebaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentKnowledgebase,
    isLoading,
    fetchKnowledgebase,
    subscribe,
    unsubscribe,
    updateKnowledgebase,
    deleteKnowledgebase,
    isSubscribed,
    isAdmin,
  } = useKnowledgebaseContext();

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const knowledgebaseId = id ? parseInt(id) : null;

  // Fetch knowledgebase and corpus on mount
  useEffect(() => {
    if (knowledgebaseId) {
      fetchKnowledgebase(knowledgebaseId);
    }
  }, [knowledgebaseId, fetchKnowledgebase]);

  const handleBack = () => {
    navigate("/knowledgebase/home");
  };

  const handleSubscribe = useCallback(async () => {
    if (!knowledgebaseId) return;
    setIsSubscribing(true);
    await subscribe(knowledgebaseId);
    setIsSubscribing(false);
  }, [knowledgebaseId, subscribe]);

  const handleUnsubscribe = useCallback(async () => {
    if (!knowledgebaseId) return;
    setIsSubscribing(true);
    await unsubscribe(knowledgebaseId);
    setIsSubscribing(false);
  }, [knowledgebaseId, unsubscribe]);

  const handleEdit = () => {
    navigate(`/knowledgebase/${knowledgebaseId}/edit`);
  };

  const handleDelete = async () => {
    if (!knowledgebaseId) return;
    const success = await deleteKnowledgebase(knowledgebaseId);
    if (success) {
      navigate("/knowledgebase/home");
    }
  };

  const handleAddManager = async (newUserId: string, role: ManagerRole) => {
    if (!currentKnowledgebase || !knowledgebaseId) return;
    const updatedManagers = [...(currentKnowledgebase.managers || []), { userId: newUserId, role }];
    await updateKnowledgebase(knowledgebaseId, { managers: updatedManagers });
  };

  const handleRemoveManager = async (managerUserId: string) => {
    if (!currentKnowledgebase || !knowledgebaseId) return;
    const updatedManagers = (currentKnowledgebase.managers || []).filter(
      (m) => m.userId !== managerUserId
    );
    await updateKnowledgebase(knowledgebaseId, { managers: updatedManagers });
  };

  const handleUpdateRole = async (managerUserId: string, role: ManagerRole) => {
    if (!currentKnowledgebase || !knowledgebaseId) return;
    const updatedManagers = (currentKnowledgebase.managers || []).map((m) =>
      m.userId === managerUserId ? { ...m, role } : m
    );
    await updateKnowledgebase(knowledgebaseId, { managers: updatedManagers });
  };

  // Loading state
  if (isLoading && !currentKnowledgebase) {
    return <GlobalLoader fullscreen />;
  }

  if (!currentKnowledgebase) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-default text-lg mb-4">Knowledgebase not found</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-secondary text-default rounded-md hover:bg-secondary/80 transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  const isUserAdmin = isAdmin(currentKnowledgebase);
  const isUserSubscribed = isSubscribed(currentKnowledgebase);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header with Banner */}
      <div className="animate-fade-in">
        <KnowledgebaseHeader
          knowledgebase={currentKnowledgebase}
          isSubscribed={isUserSubscribed}
          isAdmin={isUserAdmin}
          isLoading={isSubscribing}
          onBack={handleBack}
          onSubscribe={handleSubscribe}
          onUnsubscribe={handleUnsubscribe}
          onEdit={handleEdit}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      </div>

      {/* Main Content */}
      <div className=" w-full mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Corpus List - Main Content */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up animation-delay-200">
            {knowledgebaseId && (
              <CorpusList
                knowledgebaseId={knowledgebaseId}
                showDrafts={isUserAdmin}
                showActions={isUserAdmin}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-fade-in-up animation-delay-300">
            {/* Managers List - Only visible to admins */}
            {isUserAdmin && (
              <ManagerList
                managers={currentKnowledgebase.managers || []}
                isAdmin={isUserAdmin}
                onAddManager={handleAddManager}
                onRemoveManager={handleRemoveManager}
                onUpdateRole={handleUpdateRole}
              />
            )}

            {/* Subscribers Count */}
            <div className="bg-secondary/20 rounded-md p-4">
              <h3 className="font-semibold text-default mb-2">Subscribers</h3>
              <p className="text-3xl font-bold text-secondary">
                {currentKnowledgebase.subscribers_ids?.length || 0}
              </p>
              <p className="text-default/50 text-caption mt-1">people subscribed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-secondary rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-default mb-2">Delete Knowledgebase?</h2>
            <p className="text-default/60 mb-6">
              This action cannot be undone. All corpus content associated with this knowledgebase
              will also be deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-default hover:bg-primary rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
