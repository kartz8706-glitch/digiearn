"use client";

import { useEffect, useRef, useState } from "react";

export default function BackgroundAudio() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/overall-bg-loop.mp3");
    audio.loop = true;
    audio.volume = 0.32;
    audio.preload = "auto";
    audioRef.current = audio;

    const startAudio = async () => {
      try {
        await audio.play();
        setAudioEnabled(true);
      } catch {
        setAudioEnabled(false);
      }
    };

    const handlePageEvent = () => {
      void startAudio();
    };

    void startAudio();

    window.addEventListener("pointerdown", handlePageEvent, { once: true });
    window.addEventListener("keydown", handlePageEvent, { once: true });
    window.addEventListener("touchstart", handlePageEvent, { once: true });
    window.addEventListener("pageshow", handlePageEvent);
    document.addEventListener("visibilitychange", handlePageEvent);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      window.removeEventListener("pointerdown", handlePageEvent);
      window.removeEventListener("keydown", handlePageEvent);
      window.removeEventListener("touchstart", handlePageEvent);
      window.removeEventListener("pageshow", handlePageEvent);
      document.removeEventListener("visibilitychange", handlePageEvent);
    };
  }, []);

  return (
    !audioEnabled && (
      <button
        type="button"
        onClick={async () => {
          const audio = audioRef.current;
          if (!audio) return;
          try {
            await audio.play();
            setAudioEnabled(true);
          } catch {
            setAudioEnabled(false);
          }
        }}
        className="fixed bottom-4 right-4 z-[9999] rounded-full border border-[#43e58c]/40 bg-[#061a10]/90 px-3 py-2 text-xs font-medium text-[#d9ffe7] shadow-[0_0_30px_rgba(67,229,140,0.2)] backdrop-blur-sm transition hover:border-[#43e58c] hover:text-white"
      >
        Enable sound
      </button>
    )
  );
}
