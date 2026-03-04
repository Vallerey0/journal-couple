"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function LoginClient({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-50 text-zinc-900 selection:bg-pink-500/30 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Background Blobs - Static/Lightweight for Mobile Performance */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-pink-500/10 blur-[80px] dark:bg-pink-900/10 sm:h-[800px] sm:w-[800px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[80px] dark:bg-purple-900/10 sm:h-[800px] sm:w-[800px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/50 bg-white/80 p-8 shadow-xl dark:border-white/10 dark:bg-zinc-900/80"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
