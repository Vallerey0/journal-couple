"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { resendActivationAction } from "./actions";

type Props = {
  email?: string;
  compact?: boolean;
  cooldownSeconds?: number;
};

type State = { message?: string; ok?: boolean };

function storageKey(email: string) {
  return `jc_resend_activation_cd:${email.toLowerCase()}`;
}

function normalizeEmail(v: string) {
  return v.replace(/\+/g, " ").trim().toLowerCase();
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeGetCooldown(email: string) {
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function safeSetCooldown(email: string, until: number) {
  try {
    localStorage.setItem(storageKey(email), String(until));
  } catch {
    // ignore (private mode / blocked storage)
  }
}

function sanitizeMessage(msg?: string) {
  const m = (msg || "").trim();
  if (!m) return "";

  const lower = m.toLowerCase();

  // jangan tampilkan error teknis mentah
  if (lower.includes("missing_token")) {
    return "Link aktivasi tidak valid atau sudah kedaluwarsa. Silakan kirim ulang.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Terlalu sering. Coba lagi sebentar.";
  }

  return m;
}

function SubmitButton({
  disabled,
  label,
}: {
  disabled: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium
        ${
          disabled || pending
            ? "bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        }`}
    >
      {pending ? "Mengirim..." : label}
    </button>
  );
}

export default function ResendActivationForm({
  email,
  compact = false,
  cooldownSeconds = 60,
}: Props) {
  const [state, formAction] = React.useActionState<State, FormData>(
    resendActivationAction,
    {}
  );

  const initialEmail = email ? normalizeEmail(email) : "";
  const [inputEmail, setInputEmail] = React.useState(initialEmail);

  const safeEmail = normalizeEmail(inputEmail);

  const [cooldownLeft, setCooldownLeft] = React.useState(0);
  const [lastOkAt, setLastOkAt] = React.useState<number>(0);

  const canSubmit = isEmailValid(safeEmail);
  const disabled = !canSubmit || cooldownLeft > 0;

  // load cooldown ketika email valid berubah
  React.useEffect(() => {
    if (!canSubmit) {
      setCooldownLeft(0);
      return;
    }
    const until = safeGetCooldown(safeEmail);
    const now = Date.now();
    setCooldownLeft(until > now ? Math.ceil((until - now) / 1000) : 0);
  }, [safeEmail, canSubmit]);

  // tick cooldown
  React.useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => {
      setCooldownLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  // start cooldown ONLY ketika success baru terjadi (hindari re-trigger dari render)
  React.useEffect(() => {
    if (!state?.ok) return;
    if (!canSubmit) return;

    const now = Date.now();
    if (now - lastOkAt < 800) return; // guard double-fire

    const until = now + cooldownSeconds * 1000;
    safeSetCooldown(safeEmail, until);
    setCooldownLeft(cooldownSeconds);
    setLastOkAt(now);
  }, [state?.ok, canSubmit, safeEmail, cooldownSeconds, lastOkAt]);

  const message = sanitizeMessage(state?.message);

  const label =
    cooldownLeft > 0
      ? `Kirim ulang (${cooldownLeft}s)`
      : compact
      ? "Kirim ulang"
      : "Kirim ulang link aktivasi";

  return (
    <div className={compact ? "mt-3" : ""}>
      {message ? (
        <div
          className={`mb-3 rounded-xl border px-3 py-2 text-sm
            ${
              state?.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200"
            }`}
        >
          {message}
        </div>
      ) : null}

      {/* jika email tidak ada dari query -> tampilkan input */}
      {!initialEmail ? (
        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">
            Email pendaftaran
          </label>
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="nama@email.com"
            className="h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50"
          />
        </div>
      ) : null}

      <form action={formAction}>
        <input type="hidden" name="email" value={safeEmail} />
        <SubmitButton
          disabled={disabled}
          label={canSubmit ? label : "Masukkan email yang valid"}
        />
      </form>

      {!compact ? (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Tips: cek folder Spam/Promotions. Tunggu 1–2 menit sebelum kirim
          ulang.
        </p>
      ) : null}
    </div>
  );
}
