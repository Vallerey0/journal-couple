"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import envelopeClosed from "../../assets/envelope-closed.png";
import flowerTop from "../../assets/flower-envelope-top.png";
import flowerBottom from "../../assets/flower-envelope-bottom.png";
import bgMobile from "../../assets/bg-envelope-mobile.webp";
import bgDesktop from "../../assets/bg-envelope-desktop.webp";

interface IntroProps {
  data?: any;
  onOpen?: () => void;
}

export default function SakuraIntro({ data, onOpen }: IntroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden">
      {/* Background - Fixed and Full Viewport */}
      <div className="fixed inset-0 z-0">
        {/* Mobile Background */}
        <div className="md:hidden w-full h-full relative">
          <Image
            src={bgMobile}
            alt="Sakura Background Mobile"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Desktop Background */}
        <div className="hidden md:block w-full h-full relative">
          <Image
            src={bgDesktop}
            alt="Sakura Background Desktop"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Soft White Glow behind the envelope */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)",
        }}
      />

      {/* Main Container for Envelope and Flowers */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-20 flex flex-col items-center"
      >
        {/* Floating Wrapper */}
        <motion.div
          animate={{
            y: [0, -15, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative cursor-pointer"
          onClick={onOpen}
        >
          {/* Top Flower - Adjusted for Mobile First & Overlap */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="absolute -top-12 -left-10 w-56 h-56 md:w-72 md:h-72 z-30 pointer-events-none"
          >
            <Image
              src={flowerTop}
              alt="Sakura Flower Top"
              className="object-contain scale-110 md:scale-100"
            />
          </motion.div>

          {/* Envelope - Mobile First Focus */}
          <div
            className="relative overflow-visible"
            style={{
              filter: "drop-shadow(0 35px 60px rgba(0,0,0,0.35))",
            }}
          >
            <Image
              src={envelopeClosed}
              alt="Envelope"
              width={1000}
              height={750}
              className="w-[92vw] md:w-[550px] lg:w-[650px] h-auto block"
              priority
            />
          </div>

          {/* Bottom Flower - Positioned significantly lower for natural overlap */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="absolute -bottom-28 -right-6 w-56 h-56 md:w-72 md:h-72 z-30 pointer-events-none"
          >
            <Image
              src={flowerBottom}
              alt="Sakura Flower Bottom"
              className="object-contain scale-110 md:scale-100"
            />
          </motion.div>
        </motion.div>

        {/* Tap to Open Indicator - Increased margin to accommodate lower flower */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          className="mt-24 flex flex-col items-center gap-2"
        >
          <div className="w-px h-8 bg-pink-800/30" />
          <p className="text-pink-800/60 font-medium tracking-[0.2em] text-[10px] md:text-xs uppercase">
            Tap to Open
          </p>
        </motion.div>
      </motion.div>

      {/* Falling Petals (optional but fits theme) */}
      {mounted &&
        [...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              top: "-10%",
              left: `${Math.random() * 100}%`,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              top: "110%",
              left: `${Math.random() * 100}%`,
              opacity: [0, 1, 1, 0],
              rotate: 360,
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear",
            }}
            className="absolute z-20 pointer-events-none"
          >
            <div className="w-4 h-4 bg-pink-200/40 rounded-full blur-[2px]" />
          </motion.div>
        ))}
    </div>
  );
}
