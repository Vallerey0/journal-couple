"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
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

const swipeConfidenceThreshold = 10000;
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
  const backPressedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle back button
  useEffect(() => {
    if (open) {
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
    }
  }, [open, initialIndex]);

  const index = page;
  const item = items[index];

  function paginate(newDirection: number) {
    const newIndex = page + newDirection;
    if (newIndex >= 0 && newIndex < items.length) {
      setPage([newIndex, newDirection]);
      setScale(1);
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
                className="absolute w-full h-full flex items-center justify-center will-change-transform"
                // Only enable swipe if NOT zoomed
                drag={scale === 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);

                  if (swipe < -swipeConfidenceThreshold || offset.x < -100) {
                    paginate(1);
                  } else if (
                    swipe > swipeConfidenceThreshold ||
                    offset.x > 100
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
                      className="relative w-full h-full flex items-center justify-center p-0 md:p-8"
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
                      {item.image_url && (
                        <Image
                          src={item.image_url}
                          alt={item.journal_title ?? "Gallery"}
                          fill
                          className="object-contain select-none"
                          priority
                          unoptimized
                          draggable={false}
                        />
                      )}
                    </div>
                  </TransformComponent>
                </TransformWrapper>
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

          {/* FOOTER / CAPTION */}
          {(item.journal_title || item.journal_text) && scale === 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/60 p-6 text-white backdrop-blur-md pb-10 pointer-events-none">
              <div className="max-w-screen-lg mx-auto pointer-events-auto">
                {item.journal_title && (
                  <h3 className="font-semibold text-lg">
                    {item.journal_title}
                  </h3>
                )}
                {item.journal_text && (
                  <p className="text-sm opacity-80 mt-1 max-w-prose">
                    {item.journal_text}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
