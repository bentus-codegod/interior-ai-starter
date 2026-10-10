"use client";

import { useRef, useState } from "react";
import { UploadSimple, VideoCamera } from "@phosphor-icons/react";
import { ALLOWED_MIME } from "@/lib/validation";
import { drawScaled, resizeImageFile } from "@/lib/imageResize";

// Zusätzlich zu Fotos akzeptieren wir auch Videos (Roomtour). Aus einem
// Video ziehen wir mehrere Standbilder über die ganze Länge; der Nutzer
// wählt das beste als Grundlage für den Render. Eine automatische
// Auswertung aller Bilder (Raumvermessung) ist ein späterer Ausbau.
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB
// Rohdatei darf groß sein — sie wird vor dem Senden ohnehin verkleinert.
const MAX_RAW_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
// An diesen Stellen (Anteil der Videolänge) ziehen wir Standbilder.
const FRAME_POSITIONS = [0.1, 0.3, 0.5, 0.7, 0.9];

// Springt im Video an `time` und wartet, bis das Bild da ist.
function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error("seek"));
    video.currentTime = time;
  });
}

export function RoomUploader({
  imageDataUrl,
  onImage,
}: {
  imageDataUrl: string | null;
  onImage: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fromVideo, setFromVideo] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Foto verkleinert übernehmen (siehe lib/imageResize.ts).
  async function handleImage(file: File) {
    if (file.size > MAX_RAW_IMAGE_BYTES) {
      alert("Bild ist zu groß (max. 25 MB).");
      return;
    }
    try {
      const dataUrl = await resizeImageFile(file);
      setFromVideo(false);
      setFrames([]);
      onImage(dataUrl);
    } catch {
      alert("Bild konnte nicht gelesen werden.");
    }
  }

  // Aus einem Video mehrere Standbilder ziehen; das mittlere ist vorgewählt.
  async function handleVideo(file: File) {
    if (file.size > MAX_VIDEO_BYTES) {
      alert("Video ist zu groß (max. 60 MB).");
      return;
    }
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    setExtracting(true);
    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error("load"));
      });
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      const shots: string[] = [];
      for (const pos of FRAME_POSITIONS) {
        await seek(video, duration * pos);
        shots.push(drawScaled(video, video.videoWidth || 1280, video.videoHeight || 960));
      }
      setFrames(shots);
      setFromVideo(true);
      onImage(shots[Math.floor(shots.length / 2)]);
    } catch {
      alert("Video konnte nicht gelesen werden.");
    } finally {
      setExtracting(false);
      URL.revokeObjectURL(url);
    }
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
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        aria-describedby="upload-hint"
        className={`press group relative flex w-full items-center justify-center overflow-hidden rounded-md border transition-colors ${
          imageDataUrl ? "aspect-[4/3]" : "aspect-[16/9]"
        } ${
          imageDataUrl
            ? "border-line bg-sunken"
            : dragOver
              ? "border-accent/60 bg-tint"
              : "border-dashed border-line bg-panel hover:border-accent/50 hover:bg-tint/50"
        }`}
      >
        {imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageDataUrl}
            alt="Dein hochgeladener Raum"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center px-6 text-center">
            <UploadSimple size={28} className="text-muted" />
            <span className="mt-3 text-sm font-medium">Foto oder Video hochladen</span>
            <span id="upload-hint" className="mt-1 text-xs text-subtle">
              Hierher ziehen oder klicken. Foto bis 25 MB, Video bis 60 MB.
            </span>
          </span>
        )}
      </button>

      {imageDataUrl && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setFromVideo(false);
              setFrames([]);
              onImage(null);
            }}
            className="press rounded-md px-1.5 py-1 text-muted underline hover:text-ink"
          >
            Anderes Foto wählen
          </button>
          {fromVideo && (
            <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
              <VideoCamera size={14} /> Standbild aus deinem Video
            </span>
          )}
        </div>
      )}

      {extracting && (
        <div className="grid grid-cols-5 gap-2" aria-live="polite">
          <span className="sr-only">Standbilder werden aus dem Video gezogen</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="skeleton aspect-[4/3] rounded-md" />
          ))}
        </div>
      )}

      {frames.length > 1 && (
        <fieldset>
          <legend className="mb-1.5 text-xs text-muted">Bestes Standbild wählen</legend>
          <div className="grid grid-cols-5 gap-2">
            {frames.map((f, i) => {
              const active = f === imageDataUrl;
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Standbild ${i + 1}`}
                  onClick={() => onImage(f)}
                  className={`press overflow-hidden rounded-md ring-2 ring-offset-2 ring-offset-surface ${
                    active ? "ring-accent" : "ring-transparent hover:ring-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f} alt="" className="aspect-[4/3] w-full object-cover" />
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={[...ALLOWED_MIME, ...ALLOWED_VIDEO].join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann.
          e.target.value = "";
        }}
      />
    </div>
  );
}
