"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cancelPendingIntentAction } from "../cancel-action";

export function CancelPaymentButton({ intentId }: { intentId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        if (isPending) return;
        startTransition(async () => {
          await cancelPendingIntentAction(formData);
        });
      }}
      className="w-full"
    >
      <input type="hidden" name="intent_id" value={intentId} />
      <input type="hidden" name="next" value="/subscribe" />
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="w-full h-10 rounded-xl border-zinc-200 bg-white/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-white/10 dark:bg-white/5 dark:hover:bg-red-900/20 disabled:opacity-70"
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Membatalkan...</span>
          </div>
        ) : (
          "Batalkan & Pilih Baru"
        )}
      </Button>
    </form>
  );
}
