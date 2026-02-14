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
  const BUBBLE_SIZE = 56;
  const SNAP_PADDING = 8;

  // Initialize position to bottom-right
  useEffect(() => {
    // Wait for window to be available and layout to settle
    const timer = setTimeout(() => {
      const initialX = window.innerWidth - BUBBLE_SIZE - SNAP_PADDING;
      const initialY = window.innerHeight - BUBBLE_SIZE - SNAP_PADDING;

      x.set(initialX);
      y.set(initialY);

      // Initial appearance with specific transition to avoid overshoot
      controls.set({ scale: 0, opacity: 0 }); // Start hidden
      controls.start({
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 260, damping: 20 },
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Ensure scale is 1 on mount/remount
  useEffect(() => {
    controls.set({ scale: 1 });
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

    const currentX = x.get();
    const currentY = y.get();

    // Define 4 corners
    const corners = [
      { name: "tl", x: SNAP_PADDING, y: SNAP_PADDING },
      {
        name: "tr",
        x: windowWidth - BUBBLE_SIZE - SNAP_PADDING,
        y: SNAP_PADDING,
      },
      {
        name: "bl",
        x: SNAP_PADDING,
        y: windowHeight - BUBBLE_SIZE - SNAP_PADDING,
      },
      {
        name: "br",
        x: windowWidth - BUBBLE_SIZE - SNAP_PADDING,
        y: windowHeight - BUBBLE_SIZE - SNAP_PADDING,
      },
    ] as const;

    // Find closest corner
    const closest = corners.reduce((prev, curr) => {
      const prevDist = Math.hypot(currentX - prev.x, currentY - prev.y);
      const currDist = Math.hypot(currentX - curr.x, currentY - curr.y);
      return currDist < prevDist ? curr : prev;
    });

    setCorner(closest.name);

    // Animate to snap position
    controls.start({
      x: closest.x,
      y: closest.y,
      scale: 1,
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

  // Handle Play/Pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => {
          console.error("Autoplay prevented:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
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
    if (!hasInteracted) setHasInteracted(true);
    setIsPlaying(!isPlaying);
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
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  // Auto-play on first interaction if not playing
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted && !isPlaying && playlist.length > 0) {
        setHasInteracted(true);
      }
    };
    window.addEventListener("click", handleInteraction, { once: true });
    return () => window.removeEventListener("click", handleInteraction);
  }, [hasInteracted, isPlaying, playlist]);

  return (
    <>
      {/* Draggable Bubble - Always Mounted */}
      <motion.div
        key="music-bubble"
        drag
        dragMomentum={false}
        dragElastic={0.1}
        animate={controls}
        style={{ x, y, width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        onHoverEnd={() => {
          if (!isDraggingRef.current) {
            controls.start({ scale: 1 });
          }
        }}
        whileHover={{ scale: 1.1 }}
        whileDrag={{ scale: 1.25 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-0 left-0 z-[9999] cursor-pointer shadow-xl rounded-full bg-black/80 backdrop-blur-md p-2 border border-white/10 group flex items-center justify-center"
        onClick={() => {
          if (!isDraggingRef.current) {
            setIsOpen(!isOpen);
          }
        }}
      >
        {/* Pulsing effect when playing */}
        {isPlaying && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
        )}

        {/* Icon Container */}
        <div className="relative w-10 h-10 flex items-center justify-center">
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
