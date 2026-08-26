import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageDown } from "lucide-react";
import heic2any from "heic2any";

const BUCKET = "menu-images";
const FULL_MAX_PX = 1200;
const THUMB_MAX_PX = 400;
const FULL_QUALITY = 0.8;
const THUMB_QUALITY = 0.72;
/** Items whose main image is already webp and under this size are considered optimized. */
const OPTIMIZED_SIZE_LIMIT = 400 * 1024;

const getFilePath = (url: string) => {
  const raw = url.split(`/object/public/${BUCKET}/`)[1];
  return raw ? decodeURIComponent(raw.split("?")[0]) : null;
};

const loadImage = (blob: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode image"));
    };
    img.src = objectUrl;
  });

const toWebp = (img: HTMLImageElement, maxPx: number, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (width > maxPx || height > maxPx) {
      const scale = maxPx / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("WebP encoding failed"))),
      "image/webp",
      quality
    );
  });

const upload = async (blob: Blob) => {
  const name = `${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(name, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
};

export const ImageOptimizerButton = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const handleOptimize = async () => {
    setLoading(true);
    let optimized = 0;
    let skipped = 0;
    let savedBytes = 0;
    const errors: string[] = [];

    try {
      const { data: items, error } = await supabase
        .from("menu_items")
        .select("id, name, image_url, thumbnail_url");
      if (error) throw error;

      const withImages = (items ?? []).filter((item) => !!item.image_url);
      setProgress({ current: 0, total: withImages.length });

      for (let i = 0; i < withImages.length; i++) {
        const item = withImages[i];
        setProgress({ current: i + 1, total: withImages.length });

        try {
          const path = getFilePath(item.image_url as string);
          if (!path) {
            errors.push(`"${item.name}": không đọc được đường dẫn ảnh`);
            continue;
          }

          const { data: original, error: downloadErr } = await supabase.storage
            .from(BUCKET)
            .download(path);
          if (downloadErr || !original) {
            errors.push(`"${item.name}": tải ảnh gốc thất bại`);
            continue;
          }

          const isWebp = path.toLowerCase().endsWith(".webp");
          if (isWebp && original.size <= OPTIMIZED_SIZE_LIMIT && item.thumbnail_url) {
            skipped++;
            continue;
          }

          let source: Blob = original;
          const lower = path.toLowerCase();
          if (lower.endsWith(".heic") || lower.endsWith(".heif")) {
            const converted = await heic2any({ blob: source, toType: "image/png", quality: 1 });
            source = Array.isArray(converted) ? converted[0] : (converted as Blob);
          }

          const img = await loadImage(source);
          const [fullBlob, thumbBlob] = await Promise.all([
            toWebp(img, FULL_MAX_PX, FULL_QUALITY),
            toWebp(img, THUMB_MAX_PX, THUMB_QUALITY),
          ]);

          const [fullUrl, thumbUrl] = await Promise.all([upload(fullBlob), upload(thumbBlob)]);

          const { error: updateErr } = await supabase
            .from("menu_items")
            .update({ image_url: fullUrl, thumbnail_url: thumbUrl })
            .eq("id", item.id);
          if (updateErr) throw updateErr;

          savedBytes += Math.max(0, original.size - fullBlob.size);
          optimized++;
        } catch (itemErr) {
          const message = itemErr instanceof Error ? itemErr.message : "Lỗi không xác định";
          errors.push(`"${item.name}": ${message}`);
        }
      }

      // Remove images that no menu item references anymore
      let deleted = 0;
      try {
        const { data: cleanup, error: cleanupErr } = await supabase.functions.invoke(
          "cleanup-orphan-images"
        );
        if (cleanupErr) throw cleanupErr;
        deleted = (cleanup as { deleted?: number })?.deleted ?? 0;
      } catch (cleanupErr) {
        const message = cleanupErr instanceof Error ? cleanupErr.message : "Lỗi không xác định";
        errors.push(`Dọn ảnh thừa thất bại: ${message}`);
      }

      const savedMb = (savedBytes / (1024 * 1024)).toFixed(1);
      toast({
        title: errors.length ? `Xong với ${errors.length} lỗi` : "Tối ưu ảnh hoàn tất",
        description: errors.length
          ? errors.slice(0, 2).join(" | ") +
            (errors.length > 2 ? ` ...và ${errors.length - 2} lỗi khác` : "")
          : `${optimized} ảnh đã nén (tiết kiệm ~${savedMb} MB), ${skipped} ảnh bỏ qua, ${deleted} file thừa đã xoá.`,
        variant: errors.length ? "destructive" : "default",
      });

      if (optimized > 0) window.location.reload();
    } catch (e) {
      toast({
        title: "Lỗi",
        description: e instanceof Error ? e.message : "Tối ưu ảnh thất bại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Button variant="outline" disabled={loading} onClick={handleOptimize}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Optimizing... {progress.current}/{progress.total}
        </>
      ) : (
        <>
          <ImageDown className="h-4 w-4" />
          Optimize Images
        </>
      )}
    </Button>
  );
};
