"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Check, Heart, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Mouse parallax setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Transform values for background blobs (inverted direction for depth)
  const x1 = useTransform(springX, [0, 1], [0, -50]);
  const y1 = useTransform(springY, [0, 1], [0, -50]);
  const x2 = useTransform(springX, [0, 1], [0, 50]);
  const y2 = useTransform(springY, [0, 1], [0, 50]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  function handleMouseMove(e: React.MouseEvent) {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth);
    mouseY.set(clientY / innerHeight);
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-900 selection:bg-pink-500/30 dark:bg-zinc-950 dark:text-zinc-50"
      onMouseMove={handleMouseMove}
    >
      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 1. Background Gradient Glow (Animated + Parallax) */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          style={{ x: x1, y: y1 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute -top-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-pink-500/20 blur-[120px] dark:bg-pink-900/20"
        />
        <motion.div
          style={{ x: x2, y: y2 }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            scale: {
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            },
            opacity: {
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            },
          }}
          className="absolute -bottom-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-purple-500/20 blur-[120px] dark:bg-purple-900/20"
        />
        <div className="absolute top-[40%] left-[30%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-900/10" />
      </div>

      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-20 lg:flex-row lg:justify-between lg:py-0">
        {/* Left Content */}
        <div className="z-10 mb-16 flex max-w-2xl flex-col items-center text-center lg:mb-0 lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-200/50 bg-white/50 px-4 py-1.5 text-sm font-medium text-pink-600 backdrop-blur-md dark:border-pink-800/50 dark:bg-white/5 dark:text-pink-300"
          >
            <Sparkles className="h-4 w-4" />
            <span>Journal Couple Premium</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            Satu{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              halaman
            </span>{" "}
            untuk kisah kalian.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 max-w-lg text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl"
          >
            Foto, perjalanan, dan momen spesial dalam desain modern dengan
            sentuhan elegan. Siap dibagikan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="group relative h-14 overflow-hidden rounded-full bg-zinc-900 px-8 text-base shadow-lg shadow-pink-500/20 hover:bg-zinc-800 hover:shadow-pink-500/30 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              asChild
            >
              <Link href="/register">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:animate-[shimmer_2s_infinite]" />
                <span className="relative flex items-center">
                  Buat Halaman Kami
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-zinc-200 bg-white/50 px-8 text-base backdrop-blur-sm hover:bg-white/80 dark:border-zinc-800 dark:bg-white/5 dark:hover:bg-white/10"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 text-sm text-zinc-500 dark:text-zinc-400"
          >
            Gratis mulai. Tanpa batas kreativitas.
          </motion.p>
        </div>

        {/* Right Content: Floating Mockup */}
        <div className="relative z-10 w-full max-w-[400px] lg:max-w-[500px]">
          {/* Floating Animation Wrapper */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            {/* Glass Card Background for Depth */}
            <div className="absolute -inset-4 rotate-6 rounded-[2.5rem] bg-gradient-to-br from-pink-500/10 to-purple-500/10 blur-xl dark:from-pink-500/5 dark:to-purple-500/5" />

            {/* iPhone Frame CSS */}
            <div className="relative mx-auto aspect-[9/19] w-full max-w-[320px] overflow-hidden rounded-[3rem] border-[8px] border-zinc-900 bg-zinc-950 shadow-2xl dark:border-zinc-800">
              {/* Screen Content */}
              <div className="relative h-full w-full overflow-hidden bg-white dark:bg-zinc-950">
                {/* Status Bar */}
                <div className="absolute left-0 right-0 top-0 z-20 flex h-12 items-center justify-between px-6 text-xs font-medium text-white mix-blend-difference">
                  <span>9:41</span>
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-current" />
                    <div className="h-2.5 w-2.5 rounded-full bg-current" />
                  </div>
                </div>

                {/* Browser Bar */}
                <div className="absolute left-4 right-4 top-14 z-20 flex h-8 items-center justify-center rounded-full bg-black/20 text-[10px] text-white backdrop-blur-md">
                  journalcouple.com/arya-dinda
                </div>

                {/* Hero Image in Phone */}
                <div className="relative h-3/5 w-full">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-10" />
                  <div className="h-full w-full bg-zinc-200 dark:bg-zinc-800">
                    {/* Placeholder Image Gradient */}
                    <div className="h-full w-full bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 dark:from-pink-900 dark:via-purple-900 dark:to-indigo-900 opacity-80" />
                  </div>

                  {/* Floating Glass Card Inside Phone */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute bottom-6 left-4 right-4 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full border-2 border-white/20 bg-pink-300" />
                        <div className="h-8 w-8 rounded-full border-2 border-white/20 bg-blue-300" />
                      </div>
                      <div className="text-xs font-medium text-white">
                        Arya & Dinda
                      </div>
                    </div>
                    <div className="h-1.5 w-2/3 rounded-full bg-white/40" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-white/20" />
                  </motion.div>
                </div>

                {/* Content Below Fold */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Our Journey</h3>
                    <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                    <div className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements around Phone */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -right-8 top-20 z-20 rounded-2xl border border-white/40 bg-white/20 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
            >
              <Heart className="h-8 w-8 text-pink-500 fill-pink-500/50" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute -left-8 bottom-40 z-20 rounded-2xl border border-white/40 bg-white/20 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
            >
              <Star className="h-8 w-8 text-yellow-400 fill-yellow-400/50" />
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Dirancang untuk dikenang
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Setiap detail dibuat untuk merayakan hubungan kalian dengan cara
              yang paling indah.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Desain Premium",
                desc: "Template yang dikurasi oleh desainer profesional.",
                gradient: "from-pink-500/20 to-purple-500/20",
                icon: <Sparkles className="h-6 w-6 text-pink-500" />,
              },
              {
                title: "Privasi Terjaga",
                desc: "Kontrol penuh atas siapa yang bisa melihat halaman kalian.",
                gradient: "from-blue-500/20 to-cyan-500/20",
                icon: <Check className="h-6 w-6 text-blue-500" />,
              },
              {
                title: "Mudah Dikustomisasi",
                desc: "Ubah warna, foto, dan cerita dalam hitungan detik.",
                gradient: "from-amber-500/20 to-orange-500/20",
                icon: <Star className="h-6 w-6 text-amber-500" />,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-sm backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-lg dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div
                  className={cn(
                    "mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner",
                    feature.gradient,
                  )}
                >
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-pink-500/5 to-purple-500/5" />
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-[3rem] border border-white/20 bg-white/10 p-12 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
          >
            <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Mulai kisah kalian hari ini.
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
              Bergabung dengan ribuan pasangan lainnya yang telah mengabadikan
              momen mereka.
            </p>
            <Button
              size="lg"
              className="h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-10 text-lg text-white shadow-lg shadow-pink-500/25 transition-all hover:shadow-pink-500/40 hover:scale-105"
              asChild
            >
              <Link href="/register">Buat Halaman Gratis</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
