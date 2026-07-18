import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Camera, X } from "lucide-react";

interface PhotoUploadProps {
  value: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PhotoUpload({ value, onChange, name, size = "lg" }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        className={cn(
          "relative rounded-full overflow-hidden cursor-pointer transition-all duration-200 group",
          sizeMap[size],
          dragOver ? "ring-3 ring-primary ring-offset-2" : "ring-2 ring-border/50 hover:ring-primary/40 hover:ring-offset-2"
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-6 h-6 text-muted-foreground/40 mx-auto mb-0.5" />
              <span className="text-[10px] font-medium text-muted-foreground/40 block">
                {getInitials(name || "?")}
              </span>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
          <Camera className="w-8 h-8 text-white/0 group-hover:text-white/80 transition-all duration-200" />
        </div>
      </div>

      {/* Remove button */}
      {preview && (
        <button
          onClick={handleRemove}
          className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <X className="w-3 h-3" /> Удалить фото
        </button>
      )}

      <p className="text-[11px] text-muted-foreground/40">
        Нажмите, чтобы загрузить фото
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
