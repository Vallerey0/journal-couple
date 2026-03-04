"use client";

import { useState } from "react";
import { getMidtransData } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MidtransDebugButton({ intentId }: { intentId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    setData(null);
    try {
      const res = await getMidtransData(intentId);
      if (res.error) {
        toast.error(res.error);
      } else {
        setData(res.data);
      }
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) loadData();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Midtrans Debug Data</DialogTitle>
        </DialogHeader>
        <div className="relative">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <ScrollArea className="h-[500px] w-full rounded-md border p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>
            </ScrollArea>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
