"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarIcon,
  X,
  Trash2,
  Edit,
  MoreVertical,
  ChevronLeft,
} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { saveStoryPhase, deleteStoryPhase } from "@/lib/stories/actions";
import { StoryData, StoryPhaseKey } from "./story-config";

interface StorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseKey: StoryPhaseKey;
  title: string;
  defaultData?: StoryData | null;
  initialMode?: "preview" | "edit";
}

export function StorySheet({
  open,
  onOpenChange,
  phaseKey,
  title,
  defaultData,
  initialMode,
}: StorySheetProps) {
  // Modes: "preview" | "edit"
  // If no data, default to edit. If data exists, default to preview.
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Handle "Back" button on mobile
  useEffect(() => {
    if (open) {
      // Push state to history
      window.history.pushState({ drawerOpen: true }, "", window.location.href);

      const handlePopState = () => {
        onOpenChange(false);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [open, onOpenChange]);

  // Sync state with props
  useEffect(() => {
    if (open) {
      if (initialMode) {
        setMode(initialMode);
      } else if (defaultData) {
        setMode("preview");
      } else {
        setMode("edit");
      }

      if (defaultData?.story_date) {
        setDate(new Date(defaultData.story_date));
      } else {
        setDate(undefined);
      }
    }
  }, [open, defaultData, initialMode]);

  async function handleSubmit(formData: FormData) {
    if (!date) {
      toast.error("Please select when this happened.");
      return;
    }

    setIsSubmitting(true);
    formData.set("phase_key", phaseKey);
    // Use local date string to prevent timezone shifts (toISOString converts to UTC)
    formData.set("occurred_at", format(date, "yyyy-MM-dd"));

    const promise = saveStoryPhase(formData).then((result) => {
      if (!result.success) {
        throw new Error(result.error || "Failed to save story");
      }
      return result;
    });

    toast.promise(promise, {
      loading: "Saving your story...",
      success: () => {
        // Close sheet after save or switch to preview?
        // User asked to close or behave like app. Usually save -> view.
        // Let's switch to preview if we just updated.
        // But revalidatePath might not update `defaultData` prop immediately without a refresh or parent re-render.
        // For now, let's close it as per standard save behavior, or we can stay open in preview.
        // "jika ditekan tombol kembali di hp tutup form" implies it's a transient state.
        // Let's close it to be safe and consistent with previous behavior.
        onOpenChange(false);
        return "Story saved successfully!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.message;
      },
    });
  }

  async function handleDelete() {
    setIsSubmitting(true);
    const promise = deleteStoryPhase(phaseKey).then((result) => {
      if (!result.success) throw new Error(result.error);
      router.refresh();
      return result;
    });

    toast.promise(promise, {
      loading: "Deleting story...",
      success: () => {
        onOpenChange(false);
        return "Story deleted successfully";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.message;
      },
    });
  }

  // Handle manual close to clean up history state if needed
  const handleClose = () => {
    // Ideally we should go back in history if we pushed state
    // But since onOpenChange(false) will be called, and the useEffect cleanup doesn't pop,
    // we might end up with extra history entries.
    // A robust implementation checks if we are the one who pushed.
    // Simple version: just close. The user might have to press back twice elsewhere, but it's acceptable for now.
    // Or we can history.back() if we know we are open.
    if (open) {
      // We can try to simulate back
      window.history.back();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="z-[10002] max-h-[96dvh] h-auto rounded-t-[20px] flex flex-col max-w-md mx-auto bg-white/90 backdrop-blur-xl dark:bg-zinc-950/90 border-t border-white/20 shadow-2xl">
          <DrawerTitle className="sr-only">
            {mode === "edit" ? "Edit Story" : title}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {mode === "edit" ? "Write your story" : "Read your story"}
          </DrawerDescription>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200/50 dark:border-white/10">
            {mode === "edit" && defaultData ? (
              <Button
                autoFocus
                variant="ghost"
                size="icon"
                onClick={() => setMode("preview")}
                className="-ml-2"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                autoFocus
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)} // Just close
                className="-ml-2"
              >
                <X className="h-6 w-6" />
              </Button>
            )}

            <span className="font-semibold text-lg line-clamp-1">{title}</span>

            {mode === "edit" ? (
              <Button
                onClick={() => formRef.current?.requestSubmit()}
                disabled={isSubmitting}
                variant="ghost"
                className="text-primary font-bold -mr-2"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2">
                    <MoreVertical className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[10005]">
                  <DropdownMenuItem onClick={() => setMode("edit")}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Story
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Story
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {mode === "preview" ? (
              <div className="space-y-4 select-none touch-manipulation">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "d MMMM yyyy") : "Unknown Date"}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                  {defaultData?.story || "No story written yet."}
                </div>
              </div>
            ) : (
              <form ref={formRef} action={handleSubmit} className="space-y-6">
                <input
                  type="hidden"
                  name="title"
                  value={defaultData?.title || title}
                />

                <div className="space-y-2">
                  <Label>When did it happen?</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        disabled={isSubmitting}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-muted/30 border-muted-foreground/20",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 z-[10003]"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                          setDate(d);
                          setCalendarOpen(false);
                        }}
                        initialFocus
                        fromYear={1990}
                        toYear={new Date().getFullYear() + 5}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Your Story</Label>
                  <Textarea
                    id="content"
                    name="content"
                    disabled={isSubmitting}
                    placeholder="Tell us what happened..."
                    className="min-h-[120px] resize-none bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20 leading-relaxed"
                    defaultValue={defaultData?.story || ""}
                    required
                  />
                </div>

                <div className="h-4" />
              </form>
            )}
          </div>

          {/* Footer for Edit Mode */}
          {mode === "edit" && (
            <div className="p-4 border-t bg-background">
              <Button
                onClick={() => formRef.current?.requestSubmit()}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Saving..." : "Save Story"}
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="z-[10006]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this story. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isSubmitting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
