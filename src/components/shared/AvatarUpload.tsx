import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { CameraAdd01Icon, Delete02Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { uploadAvatar, deleteAvatar } from "@/lib/avatar";
import { getInitials, getAvatarColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  currentUrl?: string;
  name: string;
  size?: "md" | "lg" | "xl";
  onUpdate: (url: string | undefined) => void;
}

export default function AvatarUpload({ currentUrl, name, size = "xl", onUpdate }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const avatarUrl = preview || currentUrl;

  const sizeClasses = {
    md: "w-16 h-16 text-lg",
    lg: "w-20 h-20 text-2xl",
    xl: "w-28 h-28 text-3xl",
  };

  const iconSizes = { md: 18, lg: 20, xl: 24 };

  const handleFile = useCallback(async (file: File) => {
    // Validate
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setError("Формат не поддерживается");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Файл больше 2 МБ");
      return;
    }

    setError("");
    setSuccess(false);

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Upload to Supabase
    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(file);
      if (publicUrl) {
        onUpdate(publicUrl);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  }, [onUpdate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleClick = () => inputRef.current?.click();

  const handleRemove = async () => {
    try {
      await deleteAvatar();
    } catch { /* ignore */ }
    setPreview(null);
    onUpdate(undefined);
  };

  return (
    <div
      ref={dropRef}
      className={cn(
        "relative group cursor-pointer",
        sizeClasses[size]
      )}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {/* Avatar display */}
      <div className={cn(
        "relative w-full h-full rounded-3xl overflow-hidden transition-shadow duration-300",
        "shadow-lg",
        dragging ? "shadow-primary/40 ring-2 ring-primary" : "shadow-black/10",
        "group-hover:shadow-xl group-hover:shadow-black/15"
      )}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={cn(
            "w-full h-full bg-linear-to-br flex items-center justify-center font-black text-white",
            getAvatarColor(name)
          )}>
            {getInitials(name)}
          </div>
        )}

        {/* Upload overlay */}
        <motion.div
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          whileHover={{ opacity: 1 }}
        >
          {uploading ? (
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <HugeiconsIcon icon={CameraAdd01Icon} size={iconSizes[size]} className="text-white" />
          )}
        </motion.div>

        {/* Success badge */}

        {/* Error tooltip */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded-full"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success badge */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-positive flex items-center justify-center shadow-lg"
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete button (show on hover when has image) */}
      {currentUrl && (
        <button
          onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:scale-110 active:scale-95"
        >
          <HugeiconsIcon icon={Delete02Icon} size={12} className="text-white" />
        </button>
      )}

      {/* Upload hint */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
      >
        {!avatarUrl && (
          <p className="text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground/80 transition-colors">
            Нажмите для загрузки
          </p>
        )}
      </motion.div>
    </div>
  );
}
