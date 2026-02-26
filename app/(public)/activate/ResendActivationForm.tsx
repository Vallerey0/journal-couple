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
      className={`group relative flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-200
        ${
          disabled || pending
            ? "cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-500"
            : "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] hover:shadow-pink-500/40"
        }`}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Mengirim...
        </span>
      ) : (
        label
      )}
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
    {},
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
          className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-sm
            ${
              state?.ok
                ? "border-emerald-200/50 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-200"
                : "border-rose-200/50 bg-rose-50/50 text-rose-800 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-200"
            }`}
        >
          {state?.ok ? (
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
          {message}
        </div>
      ) : null}

      {/* jika email tidak ada dari query -> tampilkan input */}
      {!initialEmail ? (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email pendaftaran
          </label>
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="nama@email.com"
            className="h-11 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 text-sm text-zinc-800 outline-none backdrop-blur-sm transition-all placeholder:text-zinc-400 focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:focus:border-pink-500/50 dark:focus:ring-pink-500/10"
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
        <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Tips: cek folder Spam/Promotions. Tunggu 1–2 menit sebelum kirim
          ulang.
        </p>
      ) : null}
    </div>
  );
}
