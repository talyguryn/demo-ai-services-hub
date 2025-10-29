import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";

interface ImageSelectorProps {
  onImageSelect?: (file: File) => void;
  text?: string;
  selectedImageUrl?: string;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({
  onImageSelect,
  text,
  selectedImageUrl,
}) => {
  const [preview, setPreview] = useState<string | null>(
    selectedImageUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect?.(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={handleClick}
        className="border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 p-4">
            <Upload size={32} strokeWidth={1} className="mb-2" />
            <p className="text-sm">{text || "Click to select an image"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSelector;
