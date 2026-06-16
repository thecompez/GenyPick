"use client";

import { useEffect, useRef } from "react";

export function BackgroundMusic({ isMuted }: { isMuted: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeAnimationRef = useRef<number | null>(null);
  const isMutedRef = useRef(isMuted);

  // Sync mute state to ref to avoid stale closures in useEffect
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    // Create the audio element on the client side
    const audio = new Audio("/audio/winning.mp3");
    audio.loop = true;
    audio.preload = "auto";
    // Start volume at 0 for fade-in
    audio.volume = 0;
    audioRef.current = audio;

    let hasStarted = false;
    let fadeStartTime: number | null = null;
    const fadeDuration = 4500; // 4.5 seconds fade-in
    const targetVolume = 0.4; // moderate target volume

    function startFadeIn() {
      if (isMutedRef.current) {
        const currentAudio = audioRef.current;
        if (currentAudio) {
          currentAudio.volume = 0;
        }
        return;
      }
      fadeStartTime = performance.now();
      
      function animateFade(now: number) {
        if (!fadeStartTime || isMutedRef.current) return;
        const currentAudio = audioRef.current;
        if (!currentAudio) return;

        const elapsed = now - fadeStartTime;
        const progress = Math.min(elapsed / fadeDuration, 1);
        currentAudio.volume = progress * targetVolume;

        if (progress < 1) {
          fadeAnimationRef.current = requestAnimationFrame(animateFade);
        }
      }

      fadeAnimationRef.current = requestAnimationFrame(animateFade);
    }

    async function tryPlay() {
      if (hasStarted) return;
      try {
        await audio.play();
        hasStarted = true;
        startFadeIn();
        removeInteractionListeners();
      } catch {
        // Autoplay blocked: wait for first user interaction
      }
    }

    function handleInteraction() {
      tryPlay();
    }

    function addInteractionListeners() {
      window.addEventListener("pointerdown", handleInteraction, { passive: true });
      window.addEventListener("click", handleInteraction, { passive: true });
      window.addEventListener("touchstart", handleInteraction, { passive: true });
    }

    function removeInteractionListeners() {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    }

    // Try to play immediately
    tryPlay();

    if (!hasStarted) {
      addInteractionListeners();
    }

    return () => {
      removeInteractionListeners();
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Sync mute state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }
      audio.volume = 0;
    } else {
      // If unmuted, play if paused and fade in
      if (audio.paused) {
        audio.play().catch(() => {});
      }
      
      // Cancel active fades and start a new fade-in
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }

      const currentVol = audio.volume;
      const targetVolume = 0.4;
      const fadeDuration = 2000; // slightly faster fade when manual unmute
      const fadeStartTime = performance.now();

      function animateFade(now: number) {
        const currentAudio = audioRef.current;
        if (!currentAudio) return;

        const elapsed = now - fadeStartTime;
        const progress = Math.min(elapsed / fadeDuration, 1);
        currentAudio.volume = currentVol + progress * (targetVolume - currentVol);

        if (progress < 1) {
          fadeAnimationRef.current = requestAnimationFrame(animateFade);
        }
      }

      fadeAnimationRef.current = requestAnimationFrame(animateFade);
    }
  }, [isMuted]);

  return null;
}
