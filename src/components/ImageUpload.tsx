"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (url: string | null) => void;
  bucket: "avatars" | "covers" | "kid-photos";
  aspectRatio?: "square" | "cover" | "auto";
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-20 h-20",
  md: "w-32 h-32",
  lg: "w-48 h-48",
};

const coverSizeClasses = {
  sm: "w-full h-24",
  md: "w-full h-32",
  lg: "w-full h-48",
};

export default function ImageUpload({
  currentImageUrl,
  onImageChange,
  bucket,
  aspectRatio = "square",
  size = "md",
  placeholder = "Upload image",
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClass = aspectRatio === "cover" ? coverSizeClasses[size] : sizeClasses[size];

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }

      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const { url } = await response.json();
        onImageChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreviewUrl(currentImageUrl || null);
      } finally {
        setIsUploading(false);
      }
    },
    [bucket, currentImageUrl, onImageChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const containerClasses = `
    relative overflow-hidden cursor-pointer transition-all duration-200
    ${aspectRatio === "square" ? "rounded-full" : "rounded-2xl"}
    ${isDragging ? "ring-2 ring-red ring-offset-2" : ""}
    ${sizeClass}
    ${className}
  `;

  return (
    <div className="space-y-2">
      <div
        className={containerClasses}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Upload preview"
              fill
              className="object-cover"
              unoptimized
            />
            {!isUploading && (
              <button
                onClick={handleRemove}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-foreground/40 hover:bg-gray-200 hover:text-foreground/60 transition-colors">
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-xs text-center px-2">{placeholder}</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
