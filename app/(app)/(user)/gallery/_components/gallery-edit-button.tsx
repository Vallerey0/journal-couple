"use client";

import { MoreVertical, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GalleryEditSheet } from "./gallery-edit-sheet";
import { GalleryReplaceImageSheet } from "./gallery-replace-image-sheet";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function GalleryEditButton({
  item,
  variant = "secondary",
  className,
}: {
  item: any;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
}) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/gallery/delete?id=${item.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus gambar");
      }

      toast.success("Gambar berhasil dihapus");
      router.refresh();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <GalleryEditSheet
        itemId={item.id}
        initialTitle={item.journal_title}
        initialText={item.journal_text}
        initialTakenAt={item.taken_at}
        initialIsFavorite={item.is_favorite}
        initialMemoryType={item.memory_type}
        imageUrl={item.image_url}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <GalleryReplaceImageSheet
        itemId={item.id}
        open={isReplaceOpen}
        onOpenChange={setIsReplaceOpen}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="z-[10002]">
          <DialogHeader>
            <DialogTitle>Hapus Kenangan?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Gambar dan cerita akan
              dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant={variant} className={className}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="z-[10002]">
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Info
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setIsReplaceOpen(true)}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Ganti Gambar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
