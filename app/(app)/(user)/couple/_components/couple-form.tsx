"use client";

import { useState } from "react";
import { format } from "date-fns";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { saveCouple } from "@/lib/couples/actions";

/* ================= TYPES ================= */
type Mode = "create" | "edit";

type Couple = {
  male_name: string;
  female_name: string;
  relationship_start_date: string;
  relationship_stage: "dating" | "engaged" | "married";
  married_at?: string | null;
  notes?: string | null;

  male_nickname?: string | null;
  female_nickname?: string | null;
  male_birth_date?: string | null;
  female_birth_date?: string | null;
  male_hobby?: string | null;
  female_hobby?: string | null;
  male_city?: string | null;
  female_city?: string | null;

  anniversary_note?: string | null;
  show_age?: boolean;
  show_zodiac?: boolean;
};

type Props = {
  mode: Mode;
  couple?: Couple;
};

/* ================= MAIN ================= */
export function CoupleForm({ mode, couple }: Props) {
  const isEdit = mode === "edit";

  const [stage, setStage] = useState<Couple["relationship_stage"]>(
    couple?.relationship_stage ?? "dating",
  );

  const [startDate, setStartDate] = useState<Date | undefined>(
    couple?.relationship_start_date
      ? new Date(couple.relationship_start_date)
      : undefined,
  );

  const [marriedAt, setMarriedAt] = useState<Date | undefined>(
    couple?.married_at ? new Date(couple.married_at) : undefined,
  );

  return (
    <Card className="border-zinc-200/50 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/50">
      <form action={saveCouple} className="space-y-8">
        {/* ================= CORE ================= */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Informasi Dasar
          </h2>

          <Field label="Nama Pasangan 1">
            <Input
              name="male_name"
              defaultValue={couple?.male_name}
              required
              className="border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
            />
          </Field>

          <Field label="Nama Pasangan 2">
            <Input
              name="female_name"
              defaultValue={couple?.female_name}
              required
              className="border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
            />
          </Field>

          {/* DATE PICKER — START */}
          <Field label="Tanggal mulai hubungan">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              name="relationship_start_date"
              required
            />
          </Field>

          {/* Select GROUP — STATUS */}
          <Field label="Status hubungan">
            <Select
              name="relationship_stage"
              value={stage}
              onValueChange={(v) => setStage(v as Couple["relationship_stage"])}
            >
              <SelectTrigger className="h-11 w-full border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5">
                <SelectValue placeholder="Pilih status hubungan" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="dating">Pacaran</SelectItem>
                <SelectItem value="engaged">Tunangan</SelectItem>
                <SelectItem value="married">Menikah</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* DATE PICKER — MARRIED */}
          {stage === "married" && (
            <Field label="Tanggal menikah">
              <DatePicker
                value={marriedAt}
                onChange={setMarriedAt}
                name="married_at"
                required
              />
            </Field>
          )}

          <Field label="Catatan hubungan">
            <Textarea
              name="notes"
              rows={4}
              defaultValue={couple?.notes ?? ""}
              className="resize-none border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
            />
          </Field>
        </section>

        {/* ================= EDIT ONLY ================= */}
        {isEdit && (
          <>
            {/* PROFILE */}
            <section
              id="profile"
              className="animate-in fade-in-50 scroll-mt-24 space-y-4 rounded-xl border border-zinc-200/50 bg-zinc-50/50 p-4 pt-6 dark:border-white/10 dark:bg-white/5"
            >
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Profil Pasangan
              </h2>

              <h3 className="text-xs font-medium text-muted-foreground">
                Pasangan 1
              </h3>

              <Input
                name="male_nickname"
                placeholder="Nama panggilan"
                defaultValue={couple?.male_nickname ?? ""}
                className="border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
              />

              <DatePicker
                name="male_birth_date"
                value={
                  couple?.male_birth_date
                    ? new Date(couple.male_birth_date)
                    : undefined
                }
              />

              <Input
                name="male_city"
                placeholder="Kota asal"
                defaultValue={couple?.male_city ?? ""}
                className="border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
              />

              <Input
                name="male_hobby"
                placeholder="Hobi"
                defaultValue={couple?.male_hobby ?? ""}
                className="border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
              />

              <h3 className="pt-4 text-xs font-medium text-muted-foreground">
                Pasangan 2
              </h3>

              <Input
                name="female_nickname"
                placeholder="Nama panggilan"
                defaultValue={couple?.female_nickname ?? ""}
                className="border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
              />

              <DatePicker
                name="female_birth_date"
                value={
                  couple?.female_birth_date
                    ? new Date(couple.female_birth_date)
                    : undefined
                }
              />

              <Input
                name="female_city"
                placeholder="Kota asal"
                defaultValue={couple?.female_city ?? ""}
                className="border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
              />

              <Input
                name="female_hobby"
                placeholder="Hobi"
                defaultValue={couple?.female_hobby ?? ""}
                className="border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
              />
            </section>

            {/* ANNIVERSARY */}
            <section className="space-y-4 border-t border-zinc-200/50 pt-6 dark:border-white/10">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Catatan Anniversary
              </h2>
              <Textarea
                name="anniversary_note"
                rows={3}
                defaultValue={couple?.anniversary_note ?? ""}
                className="resize-none border-zinc-200/50 bg-white/50 focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
              />
            </section>

            {/* PREFERENCES */}
            <section className="space-y-3 border-t border-zinc-200/50 pt-6 dark:border-white/10">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Preferensi Tampilan
              </h2>

              <SwitchRow
                name="show_age"
                label="Tampilkan usia"
                defaultChecked={couple?.show_age ?? true}
              />

              <SwitchRow
                name="show_zodiac"
                label="Tampilkan zodiak"
                defaultChecked={couple?.show_zodiac ?? true}
              />
            </section>
          </>
        )}

        <Button
          type="submit"
          className="group h-12 w-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40"
        >
          {mode === "create" ? "Simpan Cerita" : "Simpan Perubahan"}
        </Button>
      </form>
    </Card>
  );
}

/* ================= UI ATOMS ================= */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SwitchRow({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch name={name} defaultChecked={defaultChecked} />
    </div>
  );
}

function DatePicker({
  value,
  onChange,
  name,
  required,
}: {
  value?: Date;
  onChange?: (d?: Date) => void;
  name: string;
  required?: boolean;
}) {
  const [internalDate, setInternalDate] = useState<Date | undefined>(value);

  const selectedDate = onChange ? value : internalDate;

  function handleSelect(date?: Date) {
    if (onChange) {
      onChange(date);
    } else {
      setInternalDate(date);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start border-zinc-200/50 bg-white/50 text-left font-normal focus:border-pink-500 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5"
        >
          {selectedDate ? format(selectedDate, "PPP") : "Pilih tanggal"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          captionLayout="dropdown" // ✅ KUNCI UX
          fromYear={1950} // sesuaikan kebutuhan
          toYear={new Date().getFullYear() + 1}
          initialFocus
        />
      </PopoverContent>

      {/* hidden input for server action */}
      <input
        type="hidden"
        name={name}
        value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
        required={required}
      />
    </Popover>
  );
}
