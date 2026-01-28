"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StoryData } from "./story-config";

interface StoryNodeProps {
  title: string;
  icon: string;
  position: "left" | "right";
  data?: StoryData | null;
  onClick: () => void;
  onLongPress?: () => void;
  index: number;
  xOffset?: number;
  priority?: boolean;
}

export function StoryNode({
  title,
  icon,
  position,
  data,
  onClick,
  onLongPress,
  index,
  xOffset = 0,
  priority = false,
}: StoryNodeProps) {
  const isLocked = !data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative flex w-full items-center mb-24 last:mb-0",
        position === "left" ? "flex-row" : "flex-row-reverse",
      )}
    >
      {/* Content Side */}
      <div
        className={cn(
          "w-[35%] flex flex-col justify-center",
          position === "left"
            ? "items-end text-right pr-4"
            : "items-start text-left pl-4",
        )}
        style={{ transform: `translateX(${xOffset * (30 / 35)}%)` }}
      >
        <div onClick={onClick} className="cursor-pointer group">
          <h3
            className={cn(
              "font-bold text-sm",
              isLocked ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {title}
          </h3>
          {isLocked ? (
            <p className="text-xs text-muted-foreground italic mt-1 group-hover:text-primary transition-colors">
              Tap to unlock...
            </p>
          ) : (
            <>
              <p className="text-xs font-medium text-primary mt-0.5">
                {format(new Date(data!.story_date), "d MMMM yyyy")}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data!.story}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Center Node */}
      <div
        className="relative w-[30%] flex justify-center z-10"
        style={{ transform: `translateX(${xOffset}%)` }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={cn(
            "relative w-24 h-24 rounded-2xl border-4 shadow-lg flex items-center justify-center bg-background overflow-hidden transition-all duration-300",
            isLocked
              ? "border-muted grayscale opacity-80"
              : "border-yellow-400 ring-2 ring-yellow-400/20",
          )}
        >
          <Image
            src={icon}
            alt={title}
            width={96}
            height={96}
            className="object-cover w-full h-full"
            priority={priority}
          />

          {isLocked && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <div className="bg-background/80 p-1.5 rounded-full backdrop-blur-sm shadow-sm">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </motion.button>
      </div>

      {/* Empty Side (Balancer) */}
      <div className="w-[35%]" />
    </motion.div>
  );
}
