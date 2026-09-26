"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  ImageIcon,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface MediaImage {
  id?: string;
  url: string;
  altText: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "error" | "done";
  error?: string;
}

export interface MediaUploaderProps {
  images: MediaImage[];
  onChange: (images: MediaImage[]) => void;
  folder?: string;
  maxFiles?: number;
  maxFileSizeMb?: number;
  disabled?: boolean;
  className?: string;
  productName?: string;
}

export function MediaUploader({
  images = [],
  onChange,
  folder = "products",
  maxFiles = 24,
  maxFileSizeMb = 15,
  disabled = false,
  className,
  productName = "",
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Helper to ensure exactly one primary image
  const normalizeImages = useCallback((list: MediaImage[]): MediaImage[] => {
    if (list.length === 0) return [];
    const hasPrimary = list.some((img) => img.isPrimary);
    if (!hasPrimary) {
      return list.map((img, idx) => ({ ...img, isPrimary: idx === 0 }));
    }
    return list;
  }, []);

  // Process files (from file input or drag-and-drop)
  const processFiles = async (selectedFiles: FileList | File[]) => {
    if (disabled) return;
    setGlobalError(null);

    const fileList = Array.from(selectedFiles);
    if (fileList.length === 0) return;

    // Check max file limit
    const remainingSlots = maxFiles - images.length - pendingUploads.length;
    if (remainingSlots <= 0) {
      setGlobalError(`Maximum capacity of ${maxFiles} images reached.`);
      return;
    }

    const filesToUpload = fileList.slice(0, remainingSlots);
    if (filesToUpload.length < fileList.length) {
      setGlobalError(
        `Only the first ${remainingSlots} images were accepted (Limit: ${maxFiles}).`
      );
    }

    // Validate size and mime types
    const validFiles: File[] = [];
    for (const f of filesToUpload) {
      if (f.size > maxFileSizeMb * 1024 * 1024) {
        setGlobalError(`"${f.name}" exceeds the ${maxFileSizeMb}MB size limit.`);
        continue;
      }
      if (!f.type.startsWith("image/") && !f.name.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i)) {
        setGlobalError(`"${f.name}" is not a valid image file.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    // Create pending items with temporary preview blobs
    const newPendingItems: PendingUpload[] = validFiles.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: "uploading",
    }));

    setPendingUploads((prev) => [...prev, ...newPendingItems]);

    // Send batch multipart form upload
    try {
      const formData = new FormData();
      formData.append("folder", folder);
      validFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to upload images.");
      }

      // Extract uploaded URLs
      const uploadedFilesList: Array<{ url: string; filename: string }> =
        json.data?.files || (json.data?.url ? [json.data] : []);

      const newMediaImages: MediaImage[] = uploadedFilesList.map((item, idx) => ({
        url: item.url,
        altText: productName ? `${productName} photo ${images.length + idx + 1}` : "Product Image",
        isPrimary: images.length === 0 && idx === 0,
      }));

      // Update external images
      onChange(normalizeImages([...images, ...newMediaImages]));

      // Clear pending uploads
      const pendingIds = new Set(newPendingItems.map((p) => p.id));
      setPendingUploads((prev) => prev.filter((p) => !pendingIds.has(p.id)));
    } catch (err: any) {
      console.error("Batch upload failed:", err);
      setGlobalError(err.message || "Error during image upload.");

      // Mark pending items as failed
      const pendingIds = new Set(newPendingItems.map((p) => p.id));
      setPendingUploads((prev) =>
        prev.map((p) =>
          pendingIds.has(p.id)
            ? { ...p, status: "error", error: err.message || "Upload failed" }
            : p
        )
      );
    } finally {
      // Clean up object URLs
      newPendingItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Image actions
  const setPrimary = (index: number) => {
    if (disabled) return;
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    onChange(updated);
  };

  const removeImage = (index: number) => {
    if (disabled) return;
    const filtered = images.filter((_, idx) => idx !== index);
    onChange(normalizeImages(filtered));
  };

  const updateAltText = (index: number, text: string) => {
    if (disabled) return;
    const updated = images.map((img, idx) =>
      idx === index ? { ...img, altText: text } : img
    );
    onChange(updated);
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    if (disabled) return;
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const nextList = [...images];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIndex, 0, moved);
    onChange(normalizeImages(nextList));
  };

  const isUploading = pendingUploads.some((p) => p.status === "uploading");

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
          }
          // Reset file input value so re-selecting same file triggers onChange
          e.target.value = "";
        }}
      />

      {/* Header controls & stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white-chalk-100/10 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-sunflower-100" />
          <h3 className="font-sora text-sm font-bold text-white-chalk-100">
            Product Media Gallery
          </h3>
          <span className="text-xs text-white-chalk-100/50 bg-white-chalk-100/5 px-2 py-0.5 rounded-full font-mono">
            {images.length} / {maxFiles}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={disabled || isUploading}
              className="px-2.5 py-1 text-xs text-cadmium-red-200 hover:text-cadmium-red-100 transition cursor-pointer"
            >
              Clear All
            </button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading || images.length >= maxFiles}
            className="cursor-pointer font-bold shadow-md shadow-sunflower-100/10"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Uploading batch...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Upload Images (Multi)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="flex items-center gap-2 p-3 text-xs bg-cadmium-red-100/15 text-cadmium-red-200 border border-cadmium-red-100/30 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{globalError}</span>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="p-1 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drag & Drop Multi-Image Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading && images.length < maxFiles) {
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all group relative overflow-hidden",
          isDragging
            ? "border-sunflower-100 bg-sunflower-100/10 scale-[1.008] shadow-xl shadow-sunflower-100/20"
            : "border-white-chalk-100/15 hover:border-sunflower-100/40 bg-matt-black-200/40 hover:bg-matt-black-200/60",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform",
            isDragging
              ? "bg-sunflower-100 text-matt-black-100 scale-110"
              : "bg-sunflower-100/10 border border-sunflower-100/20 text-sunflower-100 group-hover:scale-105"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-sunflower-100" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-bold text-white-chalk-100 group-hover:text-sunflower-100 transition">
            {isDragging
              ? "Drop multiple images here to upload!"
              : "Drag & drop multiple images or click to browse"}
          </p>
          <p className="text-[11px] text-white-chalk-100/50">
            Select 1 or 10+ images at once • PNG, JPG, WEBP, SVG, GIF (Up to {maxFileSizeMb}MB per file)
          </p>
        </div>

        {isUploading && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sunflower-100/15 border border-sunflower-100/30 text-sunflower-100 text-xs font-semibold animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Uploading {pendingUploads.length} photo(s) concurrently...
          </div>
        )}
      </div>

      {/* Uploaded Gallery Grid */}
      {(images.length > 0 || pendingUploads.length > 0) && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-white-chalk-100/60 font-medium px-1">
            <span>
              Gallery Items ({images.length} uploaded
              {pendingUploads.length > 0 && `, ${pendingUploads.length} pending`})
            </span>
            <span className="text-[11px] text-sunflower-100/80">
              ★ Star icon sets the primary/cover photo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {/* Active Uploaded Images */}
            {images.map((img, idx) => (
              <div
                key={img.id || `${img.url}_${idx}`}
                className={cn(
                  "group relative rounded-xl border p-2 bg-matt-black-200/70 overflow-hidden space-y-2 transition-all shadow-sm",
                  img.isPrimary
                    ? "border-sunflower-100 ring-1 ring-sunflower-100/40 shadow-lg shadow-sunflower-100/10"
                    : "border-white-chalk-100/10 hover:border-white-chalk-100/30"
                )}
              >
                {/* Thumbnail container */}
                <div className="aspect-square rounded-lg overflow-hidden bg-matt-black-300 relative flex items-center justify-center group/thumb">
                  <img
                    src={img.url}
                    alt={img.altText || "Product photo"}
                    className="w-full h-full object-cover transition duration-200 group-hover/thumb:scale-105"
                    loading="lazy"
                  />

                  {/* Primary Badge */}
                  {img.isPrimary ? (
                    <span className="absolute top-2 left-2 bg-sunflower-100 text-matt-black-100 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Primary Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      disabled={disabled}
                      className="absolute top-2 left-2 bg-black/70 hover:bg-sunflower-100 text-white-chalk-100/80 hover:text-matt-black-100 text-[10px] font-semibold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer border border-white-chalk-100/20"
                      title="Set as primary cover image"
                    >
                      Set Primary
                    </button>
                  )}

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-2">
                    {/* View Preview Modal */}
                    <button
                      type="button"
                      onClick={() => setPreviewModalUrl(img.url)}
                      className="p-1.5 rounded-lg bg-white-chalk-100/20 hover:bg-white-chalk-100/30 text-white text-xs font-bold transition cursor-pointer"
                      title="Preview full image"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Left */}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, "left")}
                        disabled={disabled}
                        className="p-1.5 rounded-lg bg-white-chalk-100/20 hover:bg-white-chalk-100/30 text-white text-xs font-bold transition cursor-pointer"
                        title="Move left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Move Right */}
                    {idx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, "right")}
                        disabled={disabled}
                        className="p-1.5 rounded-lg bg-white-chalk-100/20 hover:bg-white-chalk-100/30 text-white text-xs font-bold transition cursor-pointer"
                        title="Move right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      disabled={disabled}
                      className="p-1.5 rounded-lg bg-cadmium-red-100 hover:bg-cadmium-red-200 text-white text-xs font-bold transition cursor-pointer shadow"
                      title="Delete image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Alt text field for SEO */}
                <div>
                  <input
                    type="text"
                    placeholder="SEO Alt tag / label..."
                    value={img.altText || ""}
                    disabled={disabled}
                    onChange={(e) => updateAltText(idx, e.target.value)}
                    className="w-full bg-matt-black-300/80 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-md px-2 py-1 text-[11px] text-white-chalk-100 outline-none transition"
                  />
                </div>
              </div>
            ))}

            {/* Pending In-Flight Upload Placeholders */}
            {pendingUploads.map((pending) => (
              <div
                key={pending.id}
                className="relative rounded-xl border border-sunflower-100/40 p-2 bg-matt-black-200/50 overflow-hidden space-y-2 animate-pulse"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-matt-black-300 relative flex items-center justify-center">
                  <img
                    src={pending.previewUrl}
                    alt="Uploading preview"
                    className="w-full h-full object-cover opacity-50 blur-[1px]"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5 text-center p-2">
                    {pending.status === "uploading" ? (
                      <>
                        <Loader2 className="w-5 h-5 text-sunflower-100 animate-spin" />
                        <span className="text-[10px] font-bold text-sunflower-100">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-cadmium-red-100" />
                        <span className="text-[10px] font-bold text-cadmium-red-200">
                          Failed
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-6 bg-matt-black-300/50 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-matt-black-100 border border-white-chalk-100/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-white-chalk-100/10">
              <span className="text-xs font-semibold text-white-chalk-100/70">
                Image Full Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="p-1 rounded-lg hover:bg-white-chalk-100/10 text-white-chalk-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={previewModalUrl}
                alt="Full Preview"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
