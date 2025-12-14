import { useCallback, useState } from "react";
import api from "../utils/api";
import type { Note, DocumentUploadResponse } from "../types/notes";

// =============================================================================
// useDocumentUpload Hook - Handles document upload and conversion to notes
// =============================================================================

interface UseDocumentUploadOptions {
  userId: string | undefined;
  onSuccess?: (note: Note) => void;
  onError?: (error: string) => void;
}

interface UseDocumentUploadReturn {
  uploadDocument: (file: File) => Promise<Note | null>;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  clearError: () => void;
  validateFile: (file: File) => string | null;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTS = ['.pdf', '.rtf', '.docx', '.md'];

export function useDocumentUpload({
  userId,
  onSuccess,
  onError,
}: UseDocumentUploadOptions): UseDocumentUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Validate file before upload
  // ---------------------------------------------------------------------------
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_SIZE) {
      return `File is too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
    }

    // Check file extension
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTS.includes(extension)) {
      return `Unsupported file type. Allowed: PDF, DOCX, RTF, MD`;
    }

    return null;
  }, []);

  // ---------------------------------------------------------------------------
  // Clear error
  // ---------------------------------------------------------------------------
  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Upload document
  // ---------------------------------------------------------------------------
  const uploadDocument = useCallback(
    async (file: File): Promise<Note | null> => {
      if (!userId) {
        const error = "User not authenticated";
        setUploadError(error);
        onError?.(error);
        return null;
      }

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        onError?.(validationError);
        return null;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);

        // Use XMLHttpRequest for progress tracking
        const response = await new Promise<DocumentUploadResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                if (data.error) {
                  reject(new Error(data.error));
                } else {
                  resolve(data);
                }
              } catch {
                reject(new Error("Failed to parse response"));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload was cancelled"));
          });

          // Get the base URL from axios instance
          const baseURL = api.defaults.baseURL || "";
          xhr.open("POST", `${baseURL}/upload-document`);
          
          // Add authorization header if available
          const token = localStorage.getItem("token");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }

          xhr.send(formData);
        });

        setUploadProgress(100);
        onSuccess?.(response.note);
        return response.note;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to upload document";
        setUploadError(errorMessage);
        onError?.(errorMessage);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [userId, validateFile, onSuccess, onError]
  );

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadError,
    clearError,
    validateFile,
  };
}
