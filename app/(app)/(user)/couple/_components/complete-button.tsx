"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CompleteButton() {
  return (
    <div className="relative">
      <style jsx>{`
        @keyframes ripple-wave {
          0% {
            transform: scale(1);
            opacity: 0.8;
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
          }
          100% {
            transform: scale(2);
            opacity: 0;
            box-shadow: 0 0 20px 20px rgba(245, 158, 11, 0);
          }
        }
        .animate-ripple-wave {
          animation: ripple-wave 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        @keyframes shine {
          0% {
            left: -100%;
            opacity: 0;
          }
          20% {
            left: -100%;
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
          80% {
            left: 100%;
            opacity: 0.5;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
      `}</style>

      {/* Radiating Waves (Behind) */}
      <div className="absolute inset-0 -z-10 rounded-full bg-orange-500/50 animate-ripple-wave" />
      <div className="absolute inset-0 -z-10 rounded-full bg-orange-500/30 animate-ripple-wave delay-1000" />

      <Button
        asChild
        size="sm"
        className="relative group overflow-hidden rounded-full bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/20 h-9 px-4 text-xs font-semibold"
      >
        <Link href="/couple/edit#profile">
          <span className="relative z-10">Complete</span>
          {/* Moving shine effect */}
          <span className="animate-shine absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />
        </Link>
      </Button>
    </div>
  );
}
