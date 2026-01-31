"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Copy,
  Share2,
  ExternalLink,
  Sparkles,
  Check,
  Edit2,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateCoupleSlug } from "@/lib/couples/actions";
import { cn } from "@/lib/utils";

type Props = {
  coupleId: string;
  initialSlug: string;
  baseUrl: string;
};

export function SlugManager({ coupleId, initialSlug, baseUrl }: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialSlug);
  const [pending, startTransition] = useTransition();

  // Sync state if initialSlug changes (e.g. after revalidation)
  useEffect(() => {
    setSlug(initialSlug);
    setInputValue(initialSlug);
  }, [initialSlug]);

  const fullUrl = `${baseUrl}/${slug}`;
  const previewUrl = `${baseUrl}/${inputValue}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link berhasil disalin!");
    } catch (err) {
      toast.error("Gagal menyalin link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Journal Couple",
          text: "Lihat journal kami!",
          url: fullUrl,
        });
      } catch (err) {
        // Ignore abort error
      }
    } else {
      handleCopy();
    }
  };

  const handleSave = () => {
    if (inputValue === slug) {
      setIsEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await updateCoupleSlug(coupleId, inputValue);

      if (result.success) {
        toast.success("Link berhasil diperbarui!");
        setSlug(inputValue);
        setIsEditing(false);
      } else {
        toast.error(result.error || "Gagal memperbarui link");
      }
    });
  };

  const handleCancel = () => {
    setInputValue(slug);
    setIsEditing(false);
  };

  return (
    <div className="group relative overflow-hidden rounded-[32px] border border-border bg-card/40 dark:bg-white/[0.02] backdrop-blur-3xl p-6 md:p-8 transition-all hover:bg-muted/50 dark:hover:bg-white/[0.04]">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-orange-500 opacity-20 blur-lg rounded-full animate-pulse" />
              <div className="relative h-full w-full rounded-full bg-gradient-to-tr from-pink-500/10 to-orange-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 dark:text-pink-400">
                <Share2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-foreground dark:text-white">
                  Share Journal
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider">
                  Public
                </span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-white/50 mt-0.5">
                Bagikan momen spesial kalian
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Edit Toggle */}
            {!isEditing && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white hover:bg-muted/50 dark:hover:bg-white/10 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}

            {/* Open External */}
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white hover:bg-muted/50 dark:hover:bg-white/10 transition-colors"
            >
              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Input / Display Area */}
        <div className="relative group/input">
          <div
            className={cn(
              "absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-2xl blur transition duration-500",
              isEditing
                ? "opacity-100"
                : "opacity-0 group-hover/input:opacity-100",
            )}
          />

          <div className="relative flex flex-col sm:flex-row gap-3 rounded-2xl bg-muted/50 dark:bg-black/40 p-3 sm:p-4 border border-border dark:border-white/10 transition-colors backdrop-blur-md">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground/70 dark:text-white/30 font-bold uppercase tracking-widest mb-0.5">
                {isEditing ? "Edit Slug (URL)" : "Public Link"}
              </p>

              {isEditing ? (
                <div className="flex flex-col gap-1 w-full min-w-0">
                  <span className="text-xs font-mono text-muted-foreground/60">
                    {baseUrl}/
                  </span>
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="h-9 w-full px-3 border border-border bg-background/50 text-sm font-mono text-foreground focus-visible:ring-1 focus-visible:ring-pink-500 rounded-lg"
                    placeholder="your-custom-slug"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="w-full min-w-0 bg-background/50 dark:bg-black/20 rounded-lg border border-border/50 p-2.5">
                  <p className="break-all text-sm font-mono text-foreground dark:text-white leading-relaxed selection:bg-pink-500/30">
                    {fullUrl}
                  </p>
                </div>
              )}
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border/50 sm:pl-3">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleCancel}
                    disabled={pending}
                    className="h-10 w-10 p-0 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={pending || inputValue.length < 3}
                    className="h-10 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                  >
                    {pending ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={handleShare}
                    className="h-10 w-10 p-0 sm:w-auto sm:px-5 rounded-xl bg-background/50 dark:bg-white/10 hover:bg-background dark:hover:bg-white/20 text-xs font-semibold text-foreground dark:text-white shadow-none border border-border/50 dark:border-white/5 transition-all active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className="h-10 w-10 p-0 sm:w-auto sm:px-5 rounded-xl bg-background/50 dark:bg-white/10 hover:bg-background dark:hover:bg-white/20 text-xs font-semibold text-foreground dark:text-white shadow-none border border-border/50 dark:border-white/5 transition-all active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-1">
          <Sparkles className="w-3 h-3 text-amber-500/50 dark:text-amber-400/50" />
          <p className="text-[11px] text-muted-foreground/70 dark:text-white/30 text-center font-medium">
            {isEditing
              ? "Slug harus unik, minimal 3 karakter, tanpa spasi"
              : "Tampilan journal berbentuk slide presentasi (mobile-friendly)"}
          </p>
          <Sparkles className="w-3 h-3 text-amber-500/50 dark:text-amber-400/50" />
        </div>
      </div>
    </div>
  );
}
