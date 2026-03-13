"use client";

import { motion } from "framer-motion";

export function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/30 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-4">
        {/* Animated Rings */}
        <div className="relative h-20 w-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full bg-pink-500/20"
          />
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 rounded-full border-t-2 border-l-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
          />
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-3 rounded-full border-b-2 border-r-2 border-purple-500 opacity-50"
          />
        </div>

        {/* Text Animation */}
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-sm font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent tracking-widest uppercase">
            Memuat...
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                className="h-1 w-1 rounded-full bg-pink-400"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
