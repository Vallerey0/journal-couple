"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  Calendar,
  Heart,
  MapPin,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import type { GalleryItem } from "./gallery-card";
import { GalleryEditButton } from "./gallery-edit-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  items: GalleryItem[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  coupleId: string;
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 1,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 1,
  }),
};

const swipeConfidenceThreshold = 500;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

import { createPortal } from "react-dom";

// ... existing imports

export function GalleryViewer({
  items,
  initialIndex,
  open,
  onClose,
  coupleId,
}: Props) {
  const [[page, direction], setPage] = useState([initialIndex, 0]);
  const [scale, setScale] = useState(1);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [mounted, setMounted] = useState(false);
  const [showCaption, setShowCaption] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const captionDragControls = useDragControls();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle back button
  useEffect(() => {
    if (open) {
      setShowCaption(true); // Reset caption state when opening
      setImageLoading(true); // Reset loading state when opening
      // Push state when opening
      window.history.pushState({ galleryOpen: true }, "");

      const onPopState = () => {
        onClose();
      };

      window.addEventListener("popstate", onPopState);

      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
  }, [open, onClose]);

  const handleClose = () => {
    window.history.back();
  };

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (open) {
      setPage([initialIndex, 0]);
      setScale(1);
      setShowCaption(true);
      setImageLoading(true);
    }
  }, [open, initialIndex]);

  const index = page;
  const item = items[index];

  function paginate(newDirection: number) {
    const newIndex = page + newDirection;
    if (newIndex >= 0 && newIndex < items.length) {
      setPage([newIndex, newDirection]);
      setScale(1);
      setShowCaption(true);
      setImageLoading(true);
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowRight") paginate(1);
      if (e.key === "ArrowLeft") paginate(-1);
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, page, items.length]); // eslint-disable-line

  function toggleZoom() {
    if (transformRef.current) {
      const { zoomIn, resetTransform } = transformRef.current;
      if (scale > 1) {
        resetTransform();
      } else {
        zoomIn();
      }
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm"
        >
          {/* HEADER */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 text-white bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
            <div className="pointer-events-auto flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="text-sm font-medium pointer-events-auto">
              {index + 1} / {items.length}
            </div>

            <div className="pointer-events-auto flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-white hover:bg-white/20 hidden md:flex"
                onClick={toggleZoom}
              >
                {scale > 1 ? (
                  <ZoomOut className="h-5 w-5" />
                ) : (
                  <ZoomIn className="h-5 w-5" />
                )}
              </Button>

              <GalleryEditButton
                item={item}
                variant="ghost"
                className="rounded-full text-white hover:bg-white/20"
              />
            </div>
          </div>

          {/* MAIN IMAGE AREA */}
          <div
            className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center"
            onClick={(e) => {
              // Only close if clicking background (not image)
            }}
          >
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              <motion.div
                key={page}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 200, damping: 30 },
                }}
                className="absolute inset-0 flex items-center justify-center will-change-transform bg-black/0 touch-pan-y"
                // Only enable swipe if NOT zoomed
                drag={scale === 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);

                  if (swipe < -swipeConfidenceThreshold || offset.x < -30) {
                    paginate(1);
                  } else if (
                    swipe > swipeConfidenceThreshold ||
                    offset.x > 30
                  ) {
                    paginate(-1);
                  }
                }}
              >
                <TransformWrapper
                  ref={transformRef}
                  initialScale={1}
                  minScale={1}
                  maxScale={4}
                  onTransformed={(ref) => setScale(ref.state.scale)}
                  wheel={{ disabled: true }}
                  doubleClick={{ disabled: true }} // Handle manually for toggle behavior
                  panning={{ disabled: scale <= 1 }} // Enable parent swipe when not zoomed
                >
                  <TransformComponent
                    wrapperClass="!w-full !h-full flex items-center justify-center"
                    contentClass="!w-full !h-full flex items-center justify-center"
                  >
                    <div
                      className="relative w-full h-full flex items-center justify-center"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (transformRef.current) {
                          const { zoomIn, resetTransform } =
                            transformRef.current;
                          if (scale > 1) {
                            resetTransform();
                          } else {
                            zoomIn();
                          }
                        }
                      }}
                    >
                      {imageLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                          <div className="relative">
                            <Loader2 className="h-10 w-10 text-pink-500 animate-spin" />
                            <motion.div
                              className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0.8, 0.5],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                          <p className="text-xs font-medium text-white/40 tracking-widest uppercase animate-pulse">
                            Memuat Momen...
                          </p>
                        </div>
                      )}
                      {item.image_url && (
                        <Image
                          src={item.image_url}
                          alt={item.journal_title ?? "Gallery"}
                          fill
                          className={cn(
                            "object-contain select-none transition-all duration-500",
                            imageLoading
                              ? "opacity-0 scale-95 blur-sm"
                              : "opacity-100 scale-100 blur-0",
                          )}
                          onLoadingComplete={() => setImageLoading(false)}
                          priority
                          unoptimized
                          draggable={false}
                        />
                      )}
                    </div>
                  </TransformComponent>
                </TransformWrapper>

                {/* FOOTER / CAPTION - SWIPEABLE (INSIDE PAGINATED DIV) */}
                {(item.journal_title || item.journal_text) && scale === 1 && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: showCaption ? 0 : "calc(100% - 60px)" }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    drag="y"
                    dragControls={captionDragControls}
                    dragListener={false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.y > 50) setShowCaption(false);
                      if (info.offset.y < -50) setShowCaption(true);
                    }}
                    className={cn(
                      "absolute bottom-0 left-0 right-0 z-20 flex flex-col",
                      "bg-gradient-to-t from-black/90 via-black/80 to-black/40 backdrop-blur-md",
                      "rounded-t-[32px] border-t border-white/10 shadow-2xl transition-colors duration-300",
                      !showCaption && "bg-black/40",
                    )}
                    // Stop horizontal propagation to parent drag="x" when vertical drag starts
                    onPointerDown={(e) => {
                      // e.stopPropagation() would prevent the parent from seeing horizontal drag too.
                      // We don't want to stop it unless it's a vertical drag.
                    }}
                  >
                    {/* DRAG HANDLE & TOGGLE */}
                    <div
                      className="flex flex-col items-center pt-3 pb-2 cursor-pointer touch-none"
                      onPointerDown={(e) => captionDragControls.start(e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCaption(!showCaption);
                      }}
                    >
                      <div className="w-12 h-1.5 rounded-full bg-white/20 mb-2" />
                      <motion.div
                        animate={{ rotate: showCaption ? 0 : 180 }}
                        transition={{ duration: 0.3 }}
                        className="text-white/60"
                      >
                        <ChevronDown className="h-6 w-6" />
                      </motion.div>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="px-6 pb-10 max-w-screen-lg mx-auto w-full overflow-hidden">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {item.journal_title && (
                            <h3 className="font-bold text-xl text-white tracking-tight leading-tight">
                              {item.journal_title}
                            </h3>
                          )}

                          <div className="flex flex-wrap gap-3">
                            {item.taken_at && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/5 text-[11px] font-medium text-white/80">
                                <Calendar className="h-3 w-3 text-pink-400" />
                                {new Date(item.taken_at).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </div>
                            )}
                            {item.is_favorite && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/20 text-[11px] font-medium text-pink-400">
                                <Heart className="h-3 w-3 fill-current" />
                                Favorit
                              </div>
                            )}
                            {item.memory_type && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/20 text-[11px] font-medium text-blue-400">
                                <MapPin className="h-3 w-3" />
                                {item.memory_type}
                              </div>
                            )}
                          </div>

                          {item.journal_text && (
                            <motion.p
                              initial={false}
                              animate={{
                                opacity: showCaption ? 1 : 0,
                                height: showCaption ? "auto" : 0,
                              }}
                              className="text-sm leading-relaxed text-white/70 max-w-prose italic font-light"
                            >
                              "{item.journal_text}"
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* NAVIGATION BUTTONS */}
            {index > 0 && scale === 1 && (
              <button
                className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-10 flex items-center justify-center outline-none group"
                onClick={(e) => {
                  e.stopPropagation();
                  paginate(-1);
                }}
              >
                <div className="p-2 bg-black/20 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                  <ChevronLeft />
                </div>
              </button>
            )}

            {index < items.length - 1 && scale === 1 && (
              <button
                className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-10 flex items-center justify-center outline-none group"
                onClick={(e) => {
                  e.stopPropagation();
                  paginate(1);
                }}
              >
                <div className="p-2 bg-black/20 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                  <ChevronRight />
                </div>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
