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

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "minimalist", label: "Minimalist" },
  { id: "dark", label: "Dark" },
  { id: "animated", label: "Animated" },
  { id: "premium", label: "Premium" },
];

export default function ThemeClientPage({
  themes,
  subscription,
  currentTheme,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredThemes = themes.filter((theme) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "premium") return theme.isPremium;
    // Case-insensitive check for tags
    return theme.tags.some(
      (tag) => tag.toLowerCase() === selectedCategory.toLowerCase(),
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header Area */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          Theme Store
        </h1>
        <p className="text-muted-foreground text-sm">
          Personalize your couple journal with our premium themes.
        </p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {cat.label}
          </button>
        ))}
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
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold">Unlock All Themes</h3>
              <p className="text-sm text-white/90">
                Get access to all premium themes and features with our Pro plan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
