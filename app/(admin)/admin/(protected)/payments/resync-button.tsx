"use client";

import { useState } from "react";
import { resyncPayment } from "./actions";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ResyncButton({ intentId }: { intentId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleResync() {
    setLoading(true);
    try {
      const result = await resyncPayment(intentId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat sinkronisasi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleResync}
      disabled={loading}
      title="Cek status ke Midtrans & Update Database"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5 mr-1" />
      )}
      Re-sync
    </Button>
  );
}
