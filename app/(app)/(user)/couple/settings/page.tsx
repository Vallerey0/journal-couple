import { archiveCouple } from "@/utils/couples/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Archive,
  Trash2,
  History,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CoupleSettingsPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/10 blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 p-4 pb-10 space-y-6">
        {/* HEADER */}
        <header className="space-y-4 pt-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10"
          >
            <Link href="/couple">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </Button>

          <div className="px-2">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your relationship data and preferences
            </p>
          </div>
        </header>

        {/* MENU GROUPS */}
        <div className="space-y-6">
          {/* GROUP: ARCHIVES */}
          <div className="space-y-3">
            <h2 className="px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Memories
            </h2>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl">
              <Link
                href="/couple/restore"
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Archived Relationships</p>
                    <p className="text-xs text-muted-foreground">
                      View past memories
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </div>
          </div>

          {/* GROUP: ACTIONS */}
          <div className="space-y-3">
            <h2 className="px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Actions
            </h2>

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl">
              {/* Archive Action */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Archive Current</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      Move this relationship to archive. Data will be preserved
                      but set to inactive.
                    </p>
                  </div>
                </div>

                <form action={archiveCouple}>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl h-11 border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-500"
                  >
                    Archive Relationship
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* GROUP: DANGER ZONE */}
          <div className="space-y-3">
            <h2 className="px-2 text-xs font-bold uppercase tracking-widest text-red-500/80">
              Danger Zone
            </h2>

            <div className="overflow-hidden rounded-[24px] border border-red-500/20 bg-red-500/5 backdrop-blur-xl">
              <div className="p-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-500">
                      Delete Permanently
                    </p>
                    <p className="text-xs text-red-500/60 leading-relaxed mt-1">
                      This action cannot be undone. All photos, notes, and data
                      will be lost forever.
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  variant="destructive"
                  className="w-full rounded-xl h-11 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                >
                  <Link href="/couple/settings/delete">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Everything
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
