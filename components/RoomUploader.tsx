"use client";

import { useRef, useState } from "react";
import { ALLOWED_MIME } from "@/lib/validation";
import { drawScaled, resizeImageFile } from "@/lib/imageResize";

// Zusätzlich zu Fotos akzeptieren wir jetzt auch Videos. Aus einem Video
// ziehen wir automatisch ein Standbild (~0,5 s), das als Bild für den
// Render und den Passform-Check dient. Die volle Video-Rundgang-Auswertung
// (mehrere Frames) ist ein späterer Ausbau.
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB
// Rohdatei darf groß sein — sie wird vor dem Senden ohnehin verkleinert.
const MAX_RAW_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB

export function RoomUploader({
  imageDataUrl,
  onImage,
}: {
  imageDataUrl: string | null;
  onImage: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fromVideo, setFromVideo] = useState(false);

  // Foto verkleinert übernehmen (siehe lib/imageResize.ts).
  async function handleImage(file: File) {
    if (file.size > MAX_RAW_IMAGE_BYTES) {
      alert("Bild ist zu groß (max. 25 MB).");
      return;
    }
    try {
      const dataUrl = await resizeImageFile(file);
      setFromVideo(false);
      onImage(dataUrl);
    } catch {
      alert("Bild konnte nicht gelesen werden.");
    }
  }

  // Aus einem Video ein Standbild extrahieren.
  function handleVideo(file: File) {
    if (file.size > MAX_VIDEO_BYTES) {
      alert("Video ist zu groß (max. 60 MB).");
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.src = url;
    video.onloadeddata = () => {
      // etwas hineinspringen, damit kein schwarzes Startbild kommt
      video.currentTime = Math.min(0.5, video.duration || 0.5);
    };
    video.onseeked = () => {
      try {
        setFromVideo(true);
        onImage(
          drawScaled(video, video.videoWidth || 1280, video.videoHeight || 960)
        );
      } catch {
        alert("Standbild konnte nicht erzeugt werden.");
      }
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      alert("Video konnte nicht gelesen werden.");
      URL.revokeObjectURL(url);
    };
  }

  function handleFile(file: File) {
    if (ALLOWED_MIME.includes(file.type)) return handleImage(file);
    if (ALLOWED_VIDEO.includes(file.type)) return handleVideo(file);
    alert("Nur Bilder (JPEG, PNG, WebP) oder Videos (MP4, WebM, MOV).");
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-mist bg-white transition hover:border-sage"
      >
        {imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageDataUrl}
            alt="Dein hochgeladener Raum"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-6 text-center text-sm text-ink/60">
            Raumfoto oder -video auswählen
            <span className="mt-1 block text-xs text-ink/40">
              Foto (JPEG, PNG, WebP · max. 25 MB) oder Video (MP4, WebM, MOV · max. 60 MB)
            </span>
          </span>
        )}
      </button>

      {imageDataUrl && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setFromVideo(false);
              onImage(null);
            }}
            className="text-sm text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            Anderes Foto/Video wählen
          </button>
          {fromVideo && (
            <span className="text-xs text-sage">Standbild aus Video</span>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={[...ALLOWED_MIME, ...ALLOWED_VIDEO].join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
