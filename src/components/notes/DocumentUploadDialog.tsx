import { useCallback, useRef, useState, type FC, type DragEvent, type ChangeEvent } from "react";
import { UploadIcon, FileTextIcon, XIcon, CheckCircleIcon, AlertCircleIcon, Loader2Icon } from "lucide-react";
import { GlobalDialog } from "../ui";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } from "../../types/notes";

// =============================================================================
// DocumentUploadDialog - Dialog for uploading and converting documents to notes
// =============================================================================

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  validateFile: (file: File) => string | null;
}

type UploadStatus = "idle" | "validating" | "uploading" | "success" | "error";

export const DocumentUploadDialog: FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  isUploading,
  uploadProgress,
  uploadError,
  validateFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Reset state when dialog closes
  // ---------------------------------------------------------------------------
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    setIsDragOver(false);
    setStatus("idle");
    onClose();
  }, [onClose]);

  // ---------------------------------------------------------------------------
  // Handle file selection
  // ---------------------------------------------------------------------------
  const handleFileSelect = useCallback(
    (file: File) => {
      setValidationError(null);
      setStatus("validating");

      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        setSelectedFile(null);
        setStatus("error");
        return;
      }

      setSelectedFile(file);
      setStatus("idle");
    },
    [validateFile]
  );

  // ---------------------------------------------------------------------------
  // Handle file input change
  // ---------------------------------------------------------------------------
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input value so the same file can be selected again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  // ---------------------------------------------------------------------------
  // Handle drag events
  // ---------------------------------------------------------------------------
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // ---------------------------------------------------------------------------
  // Handle upload
  // ---------------------------------------------------------------------------
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    await onUpload(selectedFile);

    if (!uploadError) {
      setStatus("success");
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } else {
      setStatus("error");
    }
  }, [selectedFile, onUpload, uploadError, handleClose]);

  // ---------------------------------------------------------------------------
  // Clear selected file
  // ---------------------------------------------------------------------------
  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    setStatus("idle");
  }, []);

  // ---------------------------------------------------------------------------
  // Get file icon based on extension
  // ---------------------------------------------------------------------------
  const getFileIcon = (_fileName: string) => {
    return <FileTextIcon className="size-8 text-accent" />;
  };

  // ---------------------------------------------------------------------------
  // Format file size
  // ---------------------------------------------------------------------------
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ---------------------------------------------------------------------------
  // Determine current error
  // ---------------------------------------------------------------------------
  const currentError = validationError || uploadError;

  return (
    <GlobalDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Document"
      initialWidth={450}
      initialHeight={380}
      minWidth={350}
      minHeight={300}
      resizable={false}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-caption text-default/50">
            Max {MAX_FILE_SIZE_MB}MB • {ALLOWED_EXTENSIONS.join(", ").toUpperCase()}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-default bg-secondary hover:bg-secondary/80 rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || status === "success"}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Uploading...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircleIcon className="size-4" />
                  Done!
                </>
              ) : (
                <>
                  <UploadIcon className="size-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 h-full">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-accent bg-accent/10"
              : selectedFile
              ? "border-green-500 bg-green-500/10"
              : "border-accent/50 hover:border-accent hover:bg-accent/5"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />

          {selectedFile ? (
            // File Selected View
            <div className="flex flex-col items-center gap-3 text-center">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="text-default font-medium truncate max-w-[300px]">
                  {selectedFile.name}
                </p>
                <p className="text-caption text-default/50">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && status !== "success" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="flex items-center gap-1 text-caption text-red-500 hover:text-red-600 transition-colors"
                >
                  <XIcon className="size-3" />
                  Remove
                </button>
              )}
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-4 rounded-full bg-accent/10">
                <UploadIcon className="size-8 text-accent" />
              </div>
              <div>
                <p className="text-default font-medium">
                  {isDragOver ? "Drop your file here" : "Drag and drop your file"}
                </p>
                <p className="text-caption text-default/50">
                  or click to browse
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-caption">
              <span className="text-default/70">Uploading...</span>
              <span className="text-default">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === "success" && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircleIcon className="size-5 text-green-500 shrink-0" />
            <p className="text-caption text-green-600">
              Document uploaded and converted to note successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {currentError && status !== "success" && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircleIcon className="size-5 text-red-500 shrink-0" />
            <p className="text-caption text-red-600">{currentError}</p>
          </div>
        )}
      </div>
    </GlobalDialog>
  );
};
