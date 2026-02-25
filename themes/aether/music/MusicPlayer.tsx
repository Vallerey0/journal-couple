"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useAnimation,
  PanInfo,
} from "framer-motion";
import CassetteIcon from "./CassetteIcon";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
  Link as LinkIcon,
  MapPin,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { navigationState } from "../navigationState";

interface Track {
  id: string;
  title: string;
  file_url: string;
  duration_seconds?: number;
  artist?: string;
}

interface MusicPlayerProps {
  playlist?: Track[];
}

export default function MusicPlayer({ playlist = [] }: MusicPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Drag & Position State
  const isDraggingRef = useRef(false);
  const [corner, setCorner] = useState<"tr" | "tl" | "br" | "bl">("br");
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Constants for consistency
  const DESKTOP_BUBBLE_SIZE = 56;
  const MOBILE_BUBBLE_SIZE = 48;
  const SNAP_PADDING = 8;

  // Initialize position to bottom-right (tanpa flash di kiri atas)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const currentSize = isMobile ? MOBILE_BUBBLE_SIZE : DESKTOP_BUBBLE_SIZE;

    const initialX = window.innerWidth - currentSize - SNAP_PADDING;
    const initialY = window.innerHeight - currentSize - SNAP_PADDING;

    x.set(initialX);
    y.set(initialY);

    controls.start({
      opacity: 1,
      // scale removed to prevent conflict with gestures
      transition: { type: "spring", stiffness: 260, damping: 20 },
    });
  }, []);

  // Visibility Management
  useEffect(() => {
    // Ensure bubble pointer events are active
    controls.start({ pointerEvents: "auto" });
  }, [isOpen, controls]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    // Delay resetting drag flag to prevent click triggering
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isMobile = windowWidth < 768;
    const currentSize = isMobile ? MOBILE_BUBBLE_SIZE : DESKTOP_BUBBLE_SIZE;

    // Get current position (use info.point for more accuracy on end)
    const currentX = x.get();
    const currentY = y.get();

    // Define 4 corners with safety padding
    const corners = [
      { name: "tl", x: SNAP_PADDING, y: SNAP_PADDING },
      {
        name: "tr",
        x: windowWidth - currentSize - SNAP_PADDING,
        y: SNAP_PADDING,
      },
      {
        name: "bl",
        x: SNAP_PADDING,
        y: windowHeight - currentSize - SNAP_PADDING,
      },
      {
        name: "br",
        x: windowWidth - currentSize - SNAP_PADDING,
        y: windowHeight - currentSize - SNAP_PADDING,
      },
    ] as const;

    // Find closest corner
    const closest = corners.reduce((prev, curr) => {
      const prevDist = Math.hypot(currentX - prev.x, currentY - prev.y);
      const currDist = Math.hypot(currentX - curr.x, currentY - curr.y);
      return currDist < prevDist ? curr : prev;
    });

    setCorner(closest.name);

    // Animate to snap position FORCEFULLY
    controls.start({
      x: closest.x,
      y: closest.y,
      // scale removed to prevent conflict with gestures
      opacity: 1, // Ensure visibility
      transition: { type: "spring", stiffness: 300, damping: 30 },
    });
  };

  const currentTrack = playlist[currentTrackIndex];

  // Initialize Audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = handleNext;
    }
  }, []);

  // Handle Track Change
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const wasPlaying = isPlaying;
      audioRef.current.src = currentTrack.file_url;
      if (wasPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrack]);

  // Handle Play/Pause State Sync
  useEffect(() => {
    if (audioRef.current) {
      if (!isPlaying) {
        audioRef.current.pause();
      } else {
        // Only try to play if currently paused
        if (audioRef.current.paused) {
          audioRef.current.play().catch((e) => {
            // Quietly fail, interaction handler will fix it
            console.log("Playback sync waiting for interaction");
          });
        }
      }
    }
  }, [isPlaying]);

  // Handle Mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Explicit play call for mobile compatibility
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setHasInteracted(true);
        })
        .catch((e) => {
          console.error("Manual play failed:", e);
          setIsPlaying(false);
        });
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex(
      (prev) => (prev - 1 + playlist.length) % playlist.length,
    );
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (typeof window === "undefined") return;

    navigationState.isNavigating = true;

    if (id !== "intro" && typeof document !== "undefined") {
      document.body.style.overflow = "auto";
    }

    if (id === "intro") {
      const rect = el.getBoundingClientRect();
      const center = window.innerHeight / 2;
      const isAlreadyInIntro = rect.top <= center && rect.bottom >= center;
      if (isAlreadyInIntro) {
        setIsOpen(false);
        setTimeout(() => {
          navigationState.isNavigating = false;
        }, 600);
        return;
      }

      window.dispatchEvent(new CustomEvent("reset-intro"));
      setIsOpen(false);
      setTimeout(() => {
        navigationState.isNavigating = false;
      }, 600);
      return;
    }

    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (id === "story") {
      const targetTop = rect.top + scrollTop + 2;
      window.scrollTo({ top: targetTop, behavior: "auto" });
    } else {
      const targetTop = rect.top + scrollTop;
      window.scrollTo({ top: targetTop, behavior: "auto" });
    }

    if (id === "gallery") {
      window.dispatchEvent(new CustomEvent("enter-gallery"));
    } else if (id === "story") {
      window.dispatchEvent(new CustomEvent("enter-story"));
    } else if (id === "zodiac") {
      window.dispatchEvent(new CustomEvent("reset-zodiac"));
    }

    setIsOpen(false);

    setTimeout(() => {
      navigationState.isNavigating = false;
    }, 600);
  };

  // Auto-play / Unlock Audio on Interaction
  useEffect(() => {
    // Only attach if not already interacted and not playing
    if (hasInteracted || isPlaying || playlist.length === 0) return;

    const unlockAudio = () => {
      if (!audioRef.current) return;

      // Check if we can play
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio unlocked successfully");
            setIsPlaying(true);
            setHasInteracted(true);
            // Remove listeners only after success
            window.removeEventListener("touchstart", unlockAudio);
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
            window.removeEventListener("scroll", unlockAudio);
          })
          .catch((e) => {
            console.log("Auto-unlock prevented:", e);
            // Don't remove listeners if failed, try again on next interaction
          });
      }
    };

    // Use capture phase to ensure we catch it early
    const options = { capture: true, once: false }; // Changed once:true to false so we retry if failed

    window.addEventListener("touchstart", unlockAudio, options);
    window.addEventListener("click", unlockAudio, options);
    window.addEventListener("keydown", unlockAudio, options);
    window.addEventListener("scroll", unlockAudio, options); // Added scroll as potential interaction trigger

    return () => {
      window.removeEventListener("touchstart", unlockAudio, options);
      window.removeEventListener("click", unlockAudio, options);
      window.removeEventListener("keydown", unlockAudio, options);
      window.removeEventListener("scroll", unlockAudio, options);
    };
  }, [hasInteracted, isPlaying, playlist.length]);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      setIsOpen(false);
    };

    window.history.pushState({ musicPanel: true }, "");
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);

  return (
    <>
      {/* Draggable Bubble - Always Mounted */}
      <motion.div
        key="music-bubble"
        initial={{ opacity: 0 }}
        drag
        dragMomentum={false}
        dragElastic={0.05}
        animate={controls}
        style={{
          x,
          y,
          touchAction: "none",
        }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        onTap={() => {
          if (!isDraggingRef.current) {
            // Handle tap if needed, but onClick handles toggle
          }
        }}
        whileHover={{ scale: 1.1 }}
        whileDrag={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-0 left-0 z-[9999] cursor-pointer shadow-xl rounded-full bg-black/80 backdrop-blur-md p-2 border border-white/10 group flex items-center justify-center touch-none select-none w-12 h-12 md:w-14 md:h-14"
        onClick={(e) => {
          // Prevent click if was dragging
          if (isDraggingRef.current) {
            e.stopPropagation();
            return;
          }
          setIsOpen(!isOpen);
        }}
      >
        {/* Pulsing effect when playing */}
        {isPlaying && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
        )}

        {/* Icon Container */}
        <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
          <CassetteIcon
            className="w-full h-full text-white"
            isPlaying={isPlaying}
          />
        </div>

        {/* Status Dot */}
        <div
          className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-black ${isPlaying ? "bg-green-500" : "bg-gray-400"}`}
        />
      </motion.div>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              style={{
                transformOrigin:
                  corner === "tl"
                    ? "top left"
                    : corner === "tr"
                      ? "top right"
                      : corner === "bl"
                        ? "bottom left"
                        : "bottom right",
              }}
              initial={{
                opacity: 0,
                scale: 0.5,
                x: corner.includes("r") ? 20 : -20,
                y: corner.includes("b") ? 20 : -20,
              }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.5,
                x: corner.includes("r") ? 20 : -20,
                y: corner.includes("b") ? 20 : -20,
              }}
              className={`fixed z-[9999] w-72 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white ${
                corner === "tl"
                  ? "top-6 left-6"
                  : corner === "tr"
                    ? "top-6 right-6"
                    : corner === "bl"
                      ? "bottom-6 left-6"
                      : "bottom-6 right-6"
              }`}
            >
              {/* Header / Links Area */}
              <div className="p-4 bg-white/5 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Quick Navigation
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => scrollToSection("intro")}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Calendar size={14} className="text-blue-400" />
                    <span>Intro</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("zodiac")}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <MapPin size={14} className="text-purple-400" />
                    <span>Zodiac</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("gallery")}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <ImageIcon size={14} className="text-pink-400" />
                    <span>Gallery</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("story")}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <LinkIcon size={14} className="text-green-400" />
                    <span>Story</span>
                  </button>
                </div>
              </div>

              {/* Music Player Area */}
              <div className="p-4 pt-2">
                <div className="flex items-center gap-4 mb-4 bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                    <CassetteIcon
                      className="w-full text-white"
                      isPlaying={isPlaying}
                    />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-medium truncate">
                      {currentTrack?.title || "No Track Selected"}
                    </div>
                    <div className="text-xs text-zinc-400 truncate">
                      {currentTrack?.artist || "Unknown Artist"}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      disabled={!playlist.length}
                    >
                      <SkipBack size={20} />
                    </button>

                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/20"
                      disabled={!playlist.length}
                    >
                      {isPlaying ? (
                        <Pause size={20} fill="currentColor" />
                      ) : (
                        <Play
                          size={20}
                          fill="currentColor"
                          className="ml-0.5"
                        />
                      )}
                    </button>

                    <button
                      onClick={handleNext}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      disabled={!playlist.length}
                    >
                      <SkipForward size={20} />
                    </button>
                  </div>

                  {/* Spacer for alignment */}
                  <div className="w-9" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
