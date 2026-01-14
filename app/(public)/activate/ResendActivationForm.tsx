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

function SubmitButton({
  disabled,
  label,
}: {
  disabled: boolean;
  label: string;
}) {
  const { pending } = useFormStatus(); // ✅ from react-dom

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
  const initialState: State = React.useMemo(() => ({}), []);

  // ✅ React terbaru: useActionState (bukan useFormState)
  const [state, formAction] = React.useActionState(
    resendActivationAction,
    initialState
  );

  const initialEmail = email ? normalizeEmail(email) : "";
  const [inputEmail, setInputEmail] = React.useState(initialEmail);
  const safeEmail = normalizeEmail(inputEmail);

  const [cooldownLeft, setCooldownLeft] = React.useState(0);

  // load cooldown
  React.useEffect(() => {
    if (!isEmailValid(safeEmail)) {
      setCooldownLeft(0);
      return;
    }

    const raw = localStorage.getItem(storageKey(safeEmail));
    const until = raw ? Number(raw) : 0;
    const now = Date.now();

    setCooldownLeft(until > now ? Math.ceil((until - now) / 1000) : 0);
  }, [safeEmail]);

  // tick cooldown
  React.useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => {
      setCooldownLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  // start cooldown after success
  React.useEffect(() => {
    if (!state?.ok) return;
    if (!isEmailValid(safeEmail)) return;

    const until = Date.now() + cooldownSeconds * 1000;
    localStorage.setItem(storageKey(safeEmail), String(until));
    setCooldownLeft(cooldownSeconds);
  }, [state?.ok, safeEmail, cooldownSeconds]);

  const canSubmit = isEmailValid(safeEmail);
  const disabled = !canSubmit || cooldownLeft > 0;

  const label =
    cooldownLeft > 0
      ? `Tunggu ${cooldownLeft} detik`
      : compact
      ? "Kirim ulang aktivasi"
      : "Kirim ulang link aktivasi";

  return (
    <div className={compact ? "mt-3" : ""}>
      {state?.message ? (
        <div
          className={`mb-3 rounded-xl border px-3 py-2 text-sm
            ${
              state.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200"
            }`}
        >
          {state.message}
        </div>
      ) : null}

      {/* ✅ fallback kalau email query kosong */}
      {!initialEmail ? (
        <div className="mb-3">
          <label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-300">
            Email pendaftaran
          </label>
          <input
            type="email"
            name="email_input"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="nama@email.com"
            className="h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
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
          Tips: cek folder Spam/Promotions. Link aktivasi biasanya hanya berlaku
          dalam waktu tertentu.
        </p>
      ) : null}
    </div>
  );
}
