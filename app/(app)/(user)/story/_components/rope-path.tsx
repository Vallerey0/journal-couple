"use client";

import { motion } from "framer-motion";

export function RopePath() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 flex justify-center overflow-hidden">
      <svg
        className="h-full w-full max-w-md"
        viewBox="0 0 100 800"
        preserveAspectRatio="none"
      >
        {/* Shadow/Outline */}
        <motion.path
          d="M 50 0 
             C 50 100, 20 150, 20 200 
             S 50 300, 50 400 
             S 80 500, 80 600 
             S 50 700, 50 800"
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Main Rope */}
        <motion.path
          d="M 50 0 
             C 50 100, 20 150, 20 200 
             S 50 300, 50 400 
             S 80 500, 80 600 
             S 50 700, 50 800"
          fill="none"
          stroke="#EAB308" // yellow-500
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="16 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
