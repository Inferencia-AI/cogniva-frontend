import { useState, useEffect, type FC } from "react";
import { useKnowledgebaseContext } from "../../context/KnowledgebaseContext";
import { Save, X, Plus, CheckCircle, FileEdit } from "lucide-react";
import { WysiwygEditor } from "../notes/WysiwygEditor";
import type { CorpusCreatePayload, CorpusUpdatePayload } from "../../types/corpus";

// =============================================================================
// Corpus Editor Component - Modal for creating/editing corpus
// =============================================================================

export const CorpusEditor: FC = () => {
  const {
    isCorpusEditorOpen,
    editingCorpus,
    closeCorpusEditor,
    createCorpus,
    updateCorpus,
    approveCorpus,
    currentKnowledgebase,
    fetchKnowledgebaseCorpus,
    isAdmin,
    isCorpusLoading,
  } = useKnowledgebaseContext();

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens/closes or editingCorpus changes
  useEffect(() => {
    if (isCorpusEditorOpen) {
      if (editingCorpus) {
        setTitle(editingCorpus.title || "");
        setBody(editingCorpus.body || "");
        setKeywords(editingCorpus.keywords || []);
        setIsApproved(editingCorpus.is_approved);
      } else {
        setTitle("");
        setBody("");
        setKeywords([]);
        setIsApproved(false);
      }
    }
  }, [isCorpusEditorOpen, editingCorpus]);

  // Handle adding a keyword
  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
      setKeywordInput("");
    }
  };

  // Handle removing a keyword
  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== keywordToRemove));
  };

  // Handle keyword input keydown
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    } else if (e.key === "Backspace" && !keywordInput && keywords.length > 0) {
      setKeywords(keywords.slice(0, -1));
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!body.trim()) {
      alert("Please enter content");
      return;
    }
    if (!currentKnowledgebase) {
      alert("No knowledgebase selected");
      return;
    }

    setIsSaving(true);
    try {
      if (editingCorpus) {
        const updatePayload: CorpusUpdatePayload = {
          title: title.trim(),
          body: body.trim(),
          keywords,
        };
        await updateCorpus(editingCorpus.id, updatePayload);

        if (isApproved !== editingCorpus.is_approved && isApproved) {
          await approveCorpus(editingCorpus.id, true);
        }
      } else {
        const createPayload: CorpusCreatePayload = {
          title: title.trim(),
          body: body.trim(),
          keywords,
          knowledgebase_id: currentKnowledgebase.id,
          is_approved: isApproved,
        };
        await createCorpus(createPayload);
      }

      if (currentKnowledgebase) {
        const showDrafts = isAdmin(currentKnowledgebase);
        fetchKnowledgebaseCorpus(currentKnowledgebase.id, showDrafts);
      }

      closeCorpusEditor();
    } catch (error) {
      console.error("Error saving corpus:", error);
      alert("Failed to save corpus. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (title || body || keywords.length > 0) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    closeCorpusEditor();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isCorpusEditorOpen) return null;

  const showApprovalToggle = currentKnowledgebase && isAdmin(currentKnowledgebase);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-4xl h-[90vh] bg-secondary rounded-xl flex flex-col mx-4 animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-default/10 shrink-0 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-default flex items-center gap-2">
            {editingCorpus ? (
              <>
                <FileEdit className="size-5" />
                Edit Corpus
              </>
            ) : (
              <>
                <Plus className="size-5" />
                Create New Corpus
              </>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-default/40 hover:text-default hover:bg-primary rounded-md transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-default mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                placeholder="Enter corpus title..."
                className="w-full px-4 py-3 bg-primary text-default text-lg rounded-md border border-default/10 focus:border-accent focus:outline-none"
              />
            </div>

            {/* Keywords Input */}
            <div>
              <label className="block text-sm font-medium text-default mb-2">
                Keywords{" "}
                <span className="text-default/40 font-normal">(for search)</span>
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-primary rounded-md border border-default/10 min-h-[48px]">
                {keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-default/60 text-sm rounded cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    {keyword}
                    <X className="size-3" />
                  </span>
                ))}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setKeywordInput(e.target.value)
                  }
                  onKeyDown={handleKeywordKeyDown}
                  onBlur={handleAddKeyword}
                  placeholder={keywords.length === 0 ? "Type and press Enter to add..." : ""}
                  className="flex-1 min-w-[150px] bg-transparent text-default text-sm focus:outline-none"
                />
              </div>
              <p className="text-xs text-default/40 mt-1">
                Add keywords to help users find this corpus when searching
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-default/10" />

            {/* WYSIWYG Body Editor */}
            <div>
              <label className="block text-sm font-medium text-default mb-2">
                Content
              </label>
              <div className="border border-default/10 rounded-md min-h-[300px] bg-primary">
                <WysiwygEditor
                  content={body}
                  onChange={setBody}
                  placeholder="Write your corpus content here..."
                />
              </div>
            </div>

            {/* Approval Toggle (Admin only) */}
            {showApprovalToggle && (
              <>
                <div className="border-t border-default/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-default">
                      <CheckCircle className="size-4" />
                      Publish
                    </label>
                    <p className="text-xs text-default/40 mt-1">
                      Published corpus will be visible to all subscribers
                    </p>
                  </div>
                  <button
                    onClick={() => setIsApproved(!isApproved)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isApproved ? "bg-accent" : "bg-default/20"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isApproved ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-default/10 shrink-0 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-default/60 hover:text-default rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isCorpusLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="size-4" />
            {isSaving
              ? "Saving..."
              : editingCorpus
              ? "Save Changes"
              : "Create Corpus"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorpusEditor;
