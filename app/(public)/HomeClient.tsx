"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Check,
  Heart,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  price_idr: number;
  duration_days: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

type Props = {
  plans: SubscriptionPlan[];
  ctaHref: string;
};

function ThemeIcon({ t }: { t: string | undefined }) {
  if (t === "dark") return <Moon className="h-4 w-4" />;
  if (t === "light") return <Sun className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

export default function HomeClient({ plans, ctaHref }: Props) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const mounted = useSyncExternalStore(
    (onStoreChange) => {
      const id = window.setTimeout(onStoreChange, 0);
      return () => window.clearTimeout(id);
    },
    () => true,
    () => false,
  );

  const displayTheme = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : undefined;

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const x1 = useTransform(springX, [0, 1], [0, -50]);
  const y1 = useTransform(springY, [0, 1], [0, -50]);
  const x2 = useTransform(springX, [0, 1], [0, 50]);
  const y2 = useTransform(springY, [0, 1], [0, 50]);

  function handleMouseMove(e: React.MouseEvent) {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth);
    mouseY.set(clientY / innerHeight);
  }

  const highlightPlanId =
    plans.find((p) => (p.code ?? "").toLowerCase().includes("premium"))?.id ??
    plans.find((p) => Number(p.price_idr ?? 0) > 0)?.id ??
    null;

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-900 selection:bg-pink-500/30 dark:bg-zinc-950 dark:text-zinc-50"
      onMouseMove={handleMouseMove}
    >
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <header className="fixed inset-x-0 top-0 z-40">
        <div className="container mx-auto px-4 pt-3 sm:pt-4">
          <div className="flex h-12 items-center justify-between rounded-2xl border border-white/40 bg-white/35 px-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/40 sm:h-14 sm:px-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl px-2 py-1 font-semibold tracking-tight transition-colors hover:bg-zinc-900/5 dark:hover:bg-white/5"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm">
                <Heart className="h-4 w-4 fill-white/30" />
              </span>
              <span className="text-sm sm:text-base">Journal Couple</span>
            </Link>

            <nav className="hidden items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-200 md:flex">
              {[
                { href: "/", label: "Home" },
                { href: "#features", label: "Features" },
                { href: "#pricing", label: "Pricing" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-4 py-2 transition-colors hover:bg-zinc-900/5 hover:text-zinc-950 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    aria-label="Theme"
                  >
                    <ThemeIcon t={displayTheme} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 rounded-2xl border-zinc-200/60 bg-white/80 p-2 shadow-lg backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70"
                >
                  <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                    <ThemeIcon t={displayTheme} />
                    <span>Tema</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-200/60 dark:bg-zinc-800/60" />
                  <DropdownMenuRadioGroup
                    value={mounted ? (theme ?? "system") : "system"}
                    onValueChange={(v) => setTheme(v)}
                  >
                    <DropdownMenuRadioItem
                      value="system"
                      className="cursor-pointer rounded-xl"
                    >
                      System
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="light"
                      className="cursor-pointer rounded-xl"
                    >
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="dark"
                      className="cursor-pointer rounded-xl"
                    >
                      Dark
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                className="h-10 rounded-full px-4"
                asChild
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                className="h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-5 text-white shadow-sm hover:from-pink-500/90 hover:to-purple-600/90"
                asChild
              >
                <Link href="/register">Register</Link>
              </Button>
            </div>

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-2xl border-zinc-200/60 bg-white/80 p-2 shadow-lg backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70"
                >
                  <DropdownMenuLabel className="px-2 py-2 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                    Menu
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-200/60 dark:bg-zinc-800/60" />

                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl"
                  >
                    <Link href="/">Home</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl"
                  >
                    <Link href="#features">Features</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl"
                  >
                    <Link href="#pricing">Pricing</Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-zinc-200/60 dark:bg-zinc-800/60" />
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl"
                  >
                    <Link href="/login">Login</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer rounded-xl"
                  >
                    <Link href="/register">Register</Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-zinc-200/60 dark:bg-zinc-800/60" />
                  <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                    <ThemeIcon t={displayTheme} />
                    <span>Tema</span>
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={mounted ? (theme ?? "system") : "system"}
                    onValueChange={(v) => setTheme(v)}
                  >
                    <DropdownMenuRadioItem
                      value="system"
                      className="cursor-pointer rounded-xl"
                    >
                      System
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="light"
                      className="cursor-pointer rounded-xl"
                    >
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="dark"
                      className="cursor-pointer rounded-xl"
                    >
                      Dark
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

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

      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-28 lg:flex-row lg:justify-between lg:pb-0 lg:pt-32">
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

        <div className="relative z-10 w-full max-w-[400px] lg:max-w-[500px]">
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <div className="absolute -inset-4 rotate-6 rounded-[2.5rem] bg-gradient-to-br from-pink-500/10 to-purple-500/10 blur-xl dark:from-pink-500/5 dark:to-purple-500/5" />

            <div className="relative mx-auto aspect-[9/19] w-full max-w-[320px] overflow-hidden rounded-[3rem] border-[8px] border-zinc-900 bg-zinc-950 shadow-2xl dark:border-zinc-800">
              <div className="relative h-full w-full overflow-hidden bg-white dark:bg-zinc-950">
                <div className="absolute left-0 right-0 top-0 z-20 flex h-12 items-center justify-between px-6 text-xs font-medium text-white mix-blend-difference">
                  <span>9:41</span>
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-current" />
                    <div className="h-2.5 w-2.5 rounded-full bg-current" />
                  </div>
                </div>

                <div className="absolute left-4 right-4 top-14 z-20 flex h-8 items-center justify-center rounded-full bg-black/20 text-[10px] text-white backdrop-blur-md">
                  journalcouple.com/arya-dinda
                </div>

                <div className="relative h-3/5 w-full">
                  <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/30 to-transparent" />
                  <div className="h-full w-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full w-full bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 opacity-80 dark:from-pink-900 dark:via-purple-900 dark:to-indigo-900" />
                  </div>

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

                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Our Journey</h3>
                    <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                    <div className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                  </div>
                </div>
              </div>
            </div>

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
              <Heart className="h-8 w-8 fill-pink-500/50 text-pink-500" />
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
              <Star className="h-8 w-8 fill-yellow-400/50 text-yellow-400" />
            </motion.div>
          </motion.div>
        </div>
      </main>

      <section
        id="features"
        className="relative z-10 scroll-mt-24 py-24 md:scroll-mt-28"
      >
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

      <section
        id="pricing"
        className="relative z-10 scroll-mt-24 py-24 md:scroll-mt-28"
      >
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Pricing yang sederhana
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Harga dan durasi paket diambil langsung dari database.
            </p>
          </div>

          {plans.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-sm text-zinc-600 backdrop-blur-md dark:border-white/5 dark:bg-white/5 dark:text-zinc-300">
              Paket belum tersedia.
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan) => {
                const highlight = highlightPlanId === plan.id;
                const priceText =
                  Number(plan.price_idr ?? 0) <= 0
                    ? "Gratis"
                    : formatIDR(Number(plan.price_idr ?? 0));

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-sm backdrop-blur-md transition-all dark:border-white/5 dark:bg-white/5",
                      highlight
                        ? "ring-1 ring-pink-500/30 shadow-lg shadow-pink-500/10"
                        : "hover:bg-white/20 hover:shadow-lg dark:hover:bg-white/10",
                    )}
                  >
                    {highlight && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-500 to-purple-600" />
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {plan.description || `${plan.duration_days} hari`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{priceText}</div>
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {plan.duration_days} hari
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button
                        className={cn(
                          "h-12 w-full rounded-2xl",
                          highlight
                            ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                            : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
                        )}
                        asChild
                      >
                        <Link href={ctaHref}>Pilih {plan.name}</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

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

      <footer className="mt-32 border-t border-zinc-200/60 bg-white/40 py-12 text-sm text-zinc-600 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/20 dark:text-zinc-400">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm">
                  <Heart className="h-4 w-4 fill-white/30" />
                </span>
                <div className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Journal Couple
                </div>
              </div>
              <p className="max-w-sm leading-relaxed">
                Satu halaman untuk kisah kalian. Desain modern, privasi terjaga,
                dan mudah dibagikan.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Legal
              </div>
              <div className="grid gap-2">
                <Link
                  href="/privacy-policy"
                  className="w-fit text-zinc-700 hover:text-zinc-900 hover:underline dark:text-zinc-200 dark:hover:text-white"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-of-service"
                  className="w-fit text-zinc-700 hover:text-zinc-900 hover:underline dark:text-zinc-200 dark:hover:text-white"
                >
                  Terms of Service
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Contact
              </div>
              <a
                href="https://wa.me/6282211114022"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200/60 bg-white/60 px-4 py-2 text-zinc-700 shadow-sm transition-colors hover:bg-white dark:border-zinc-800/60 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium">WhatsApp</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  082211114022
                </span>
              </a>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200/60 pt-6 text-xs text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-400 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Journal Couple. All rights reserved.
            </p>
            <p className="md:text-right">Made in Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
