import { supabase } from "./supabase";
import { useAuthStore } from "@/stores/authStore";

const BUCKET = "avatars";
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_DIMENSION = 512; // px

/**
 * Compress and resize an image to a max dimension, returns a Blob
 */
function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Resize if needed
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Smooth resize
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Output as WebP (smaller) with quality 0.85
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to compress image"));
        },
        "image/webp",
        0.85
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload an avatar to Supabase Storage.
 * Returns the public URL or null on failure.
 */
export async function uploadAvatar(file: File): Promise<string | null> {
  // Validate
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
    throw new Error("Поддерживаются только PNG, JPEG, WebP и GIF");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Файл слишком большой. Максимум 2 МБ");
  }

  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Необходимо авторизоваться");

  // Compress
  const compressed = await compressImage(file);

  // Upload to: avatars/{userId}/avatar.webp
  const filePath = `${user.id}/avatar.webp`;

  // Delete existing avatar first (optional, upsert handles it)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, compressed, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000", // 1 year cache
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Delete the current user's avatar from storage.
 */
export async function deleteAvatar(): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const filePath = `${user.id}/avatar.webp`;
  await supabase.storage.from(BUCKET).remove([filePath]);
}
