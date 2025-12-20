import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useKnowledgebaseContext } from "../../context/KnowledgebaseContext";
import { ManagerList } from "../../components/knowledgebase";
import api from "../../utils/api";
import type { ManagerRole } from "../../types/knowledgebase";

// =============================================================================
// Knowledgebase Create/Edit Page
// =============================================================================

export default function KnowledgebaseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentKnowledgebase,
    isLoading,
    fetchKnowledgebase,
    createKnowledgebase,
    updateKnowledgebase,
  } = useKnowledgebaseContext();

  const isEditMode = Boolean(id);
  const knowledgebaseId = id ? parseInt(id) : undefined;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [managers, setManagers] = useState<{ userId: string; role: ManagerRole }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch knowledgebase data in edit mode
  useEffect(() => {
    if (isEditMode && knowledgebaseId) {
      fetchKnowledgebase(knowledgebaseId);
    }
  }, [isEditMode, knowledgebaseId, fetchKnowledgebase]);

  // Populate form with existing data
  useEffect(() => {
    if (isEditMode && currentKnowledgebase) {
      setName(currentKnowledgebase.name || "");
      setDescription(currentKnowledgebase.description || "");
      setBannerUrl(currentKnowledgebase.banner_url || "");
      setImageUrl(currentKnowledgebase.image_url || "");
      setManagers(currentKnowledgebase.managers || []);
    }
  }, [isEditMode, currentKnowledgebase]);

  const handleBack = () => {
    if (isEditMode && knowledgebaseId) {
      navigate(`/knowledgebase/${knowledgebaseId}`);
    } else {
      navigate("/knowledgebase/home");
    }
  };

  const handleImageUpload = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (loading: boolean) => void
  ) => {
    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const response = await api.post<{ url: string }>("/upload-image", {
          dataUri,
          fileName: file.name,
        });
        setUrl(response.data.url);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image");
      setUploading(false);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, setBannerUrl, setUploadingBanner);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, setImageUrl, setUploadingImage);
    }
  };

  const handleAddManager = (newUserId: string, role: ManagerRole) => {
    setManagers((prev) => [...prev, { userId: newUserId, role }]);
  };

  const handleRemoveManager = (managerUserId: string) => {
    setManagers((prev) => prev.filter((m) => m.userId !== managerUserId));
  };

  const handleUpdateRole = (managerUserId: string, role: ManagerRole) => {
    setManagers((prev) =>
      prev.map((m) => (m.userId === managerUserId ? { ...m, role } : m))
    );
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!name.trim()) {
        setError("Name is required");
        return;
      }

      setIsSubmitting(true);

      try {
        if (isEditMode && knowledgebaseId) {
          await updateKnowledgebase(knowledgebaseId, {
            name: name.trim(),
            description: description.trim(),
            banner_url: bannerUrl || undefined,
            image_url: imageUrl || undefined,
            managers,
          });
          navigate(`/knowledgebase/${knowledgebaseId}`);
        } else {
          const newKb = await createKnowledgebase({
            name: name.trim(),
            description: description.trim(),
            banner_url: bannerUrl || undefined,
            image_url: imageUrl || undefined,
          });
          if (newKb) {
            navigate(`/knowledgebase/${newKb.id}`);
          }
        }
      } catch (err) {
        console.error("Error saving knowledgebase:", err);
        setError("Failed to save knowledgebase");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      name,
      description,
      bannerUrl,
      imageUrl,
      managers,
      isEditMode,
      knowledgebaseId,
      createKnowledgebase,
      updateKnowledgebase,
      navigate,
    ]
  );

  // Loading state for edit mode
  if (isEditMode && isLoading && !currentKnowledgebase) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 animate-fade-in">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-secondary text-default transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-xl font-bold text-default">
            {isEditMode ? "Edit Knowledgebase" : "Create Knowledgebase"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up animation-delay-100">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Banner Upload */}
          <div>
            <label className="block text-default font-medium mb-2">Banner Image</label>
            <div className="relative h-40 bg-secondary rounded-xl overflow-hidden">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-default/30">
                  <ImageIcon className="size-12" />
                </div>
              )}

              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                  disabled={uploadingBanner}
                />
                {uploadingBanner ? (
                  <Loader2 className="size-8 text-white animate-spin" />
                ) : (
                  <div className="flex flex-col items-center text-white">
                    <Upload className="size-8 mb-2" />
                    <span>Upload Banner</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-default font-medium mb-2">Profile Image</label>
            <div className="relative w-24 h-24 bg-secondary rounded-xl overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Image preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-default/30">
                  <ImageIcon className="size-8" />
                </div>
              )}

              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <Loader2 className="size-6 text-white animate-spin" />
                ) : (
                  <Upload className="size-6 text-white" />
                )}
              </label>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-default font-medium mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter knowledgebase name"
              className="w-full px-4 py-3 bg-secondary rounded-lg text-default placeholder:text-default/40 focus:outline-none focus:ring-2 focus:ring-accent/50"
              required
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-default font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for your knowledgebase"
              rows={4}
              className="w-full px-4 py-3 bg-secondary rounded-lg text-default placeholder:text-default/40 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
            />
          </div>

          {/* Managers Section (only in edit mode) */}
          {isEditMode && (
            <div>
              <label className="block text-default font-medium mb-2">Managers</label>
              <ManagerList
                managers={managers}
                isAdmin={true}
                onAddManager={handleAddManager}
                onRemoveManager={handleRemoveManager}
                onUpdateRole={handleUpdateRole}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-6 py-3 bg-secondary text-default rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-6 py-3 bg-secondary text-default rounded-lg font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="size-5 animate-spin" />}
              {isEditMode ? "Save Changes" : "Create Knowledgebase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
