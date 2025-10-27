import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  images: { type: "base64"; data: string; mime_type: string }[];
  onImagesChange: (
    images: { type: "base64"; data: string; mime_type: string }[]
  ) => void;
  maxSize?: number; // in bytes, default 2MB
}

export function ImageUploader({
  images,
  onImagesChange,
  maxSize = 2 * 1024 * 1024,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const convertToBase64 = (
    file: File
  ): Promise<{ type: "base64"; data: string; mime_type: string }> => {
    return new Promise((resolve, reject) => {
      if (file.size > maxSize) {
        reject(
          new Error(
            `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
          )
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          type: "base64",
          data: result,
          mime_type: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const newImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          try {
            const base64Image = await convertToBase64(file);
            newImages.push(base64Image);
          } catch (error) {
            console.error("Error converting image:", error);
            alert(`Error processing ${file.name}: ${error.message}`);
          }
        }
      }

      onImagesChange([...images, ...newImages]);
    },
    [images, onImagesChange, maxSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50/10"
            : "border-gray-600 hover:border-gray-500"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-300 mb-2">
          Drag and drop images here, or click to select
        </p>
        <p className="text-sm text-gray-500">
          Supports PNG, JPG, GIF, WebP (max 2MB each)
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Select Images
        </Button>
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">
            Uploaded Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <Card key={index} className="relative p-2">
                <img
                  src={image.data}
                  alt={`Uploaded image ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
