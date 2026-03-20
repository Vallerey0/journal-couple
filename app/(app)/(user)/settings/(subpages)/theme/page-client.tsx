"use client";

import { useState } from "react";
import ThemeCard from "./theme-card";
import { Sparkles, Palette } from "lucide-react";
import { Theme } from "@/themes/registry";
import { SubscriptionGuardResult } from "@/lib/subscriptions/guard";
import { cn } from "@/lib/utils";

// Exclude Preview component as it cannot be passed to client component
export type ClientTheme = Omit<Theme, "Preview">;

type Props = {
  themes: ClientTheme[];
  subscription: SubscriptionGuardResult;
  currentTheme: string;
};

export default function ThemeClientPage({
  themes,
  subscription,
  currentTheme,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Dynamically extract all unique tags from themes
  const dynamicTags = Array.from(
    new Set(themes.flatMap((theme) => theme.tags)),
  ).sort();

  const categories = [
    { id: "all", label: "Semua" },
    ...dynamicTags.map((tag) => ({
      id: tag.toLowerCase(),
      label: tag,
    })),
    { id: "premium", label: "Premium" },
  ];

  const filteredThemes = themes.filter((theme) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "premium") return theme.isPremium;
    // Case-insensitive check for tags
    return theme.tags.some(
      (tag) => tag.toLowerCase() === selectedCategory.toLowerCase(),
    );
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden pb-24">
      {/* BACKGROUND BLOBS - Static for performance */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 max-w-5xl mx-auto space-y-8 pt-6">
        {/* Header Area */}
        <div className="flex flex-col space-y-2 text-center items-center">
          <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-2xl sm:text-3xl font-bold text-transparent flex items-center gap-2">
            <Palette className="w-6 h-6 text-purple-500" />
            Theme Store
          </h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Personalize your couple journal with our premium themes.
          </p>
        </div>

        {/* Categories */}
        <div className="flex justify-center">
          <div className="flex gap-2 overflow-x-auto pb-2 p-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-2xl border border-white/20 max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300",
                  selectedCategory === cat.id
                    ? "bg-white text-purple-600 shadow-sm dark:bg-zinc-700 dark:text-purple-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-700/50",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredThemes.map((t) => (
            <ThemeCard
              key={t.code}
              code={t.code}
              name={t.name}
              description={t.description}
              thumbnail={t.thumbnail}
              isPremium={t.isPremium}
              active={t.code === currentTheme}
              subscription={subscription}
              tags={t.tags}
              releaseAt={t.releaseAt}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredThemes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No themes found in this category.</p>
          </div>
        )}

        {/* Pro Banner */}
        {!subscription.allowed && (
          <div className="mt-8 rounded-2xl border border-white/20 bg-gradient-to-r from-amber-500/90 to-orange-600/90 p-6 text-white shadow-xl">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-white/20 p-3 shadow-inner">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Unlock All Themes</h3>
                <p className="text-sm text-white/90 max-w-md">
                  Get access to all premium themes and features with our Pro
                  plan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
