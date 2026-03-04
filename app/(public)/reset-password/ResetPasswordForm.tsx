"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordAction } from "./actions";

type State = { message?: string };
type Field = "password" | "confirm_password";
type FieldErrors = Partial<Record<Field, string>>;
type FieldTouched = Partial<Record<Field, boolean>>;

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const width = Math.min(100, (score / 4) * 100);

  let label = "Lemah";
  let color = "bg-rose-500";

  if (score >= 4) {
    label = "Sangat Kuat";
    color = "bg-emerald-500";
  } else if (score === 3) {
    label = "Kuat";
    color = "bg-green-500";
  } else if (score === 2) {
    label = "Sedang";
    color = "bg-yellow-500";
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className={`h-full transition-all duration-300 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Kekuatan: <span className="font-medium">{label}</span>
      </p>
    </div>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.44 0 .87-.03 1.28-.09" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="group mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40 disabled:opacity-70"
    >
      {pending ? "Menyimpan..." : "Simpan Password Baru"}
    </button>
  );
}

export default function ResetPasswordForm() {
  const [state, formAction] = useActionState<State, FormData>(
    resetPasswordAction,
    { message: "" },
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<FieldTouched>({});
  const [showPassword, setShowPassword] = useState(false);

  function validate(name: Field, nextPassword = password, nextConfirm = confirm) {
    if (name === "password") {
      if (!nextPassword) return "Password wajib diisi.";
      if (nextPassword.length < 8) return "Minimal 8 karakter.";
      return "";
    }
    if (name === "confirm_password") {
      if (!nextConfirm) return "Konfirmasi password wajib diisi.";
      if (nextConfirm !== nextPassword) return "Konfirmasi password tidak sama.";
      return "";
    }
    return "";
  }

  const disableSubmit = useMemo(
    () =>
      !password ||
      password.length < 8 ||
      !confirm ||
      confirm !== password ||
      Object.values(errors).some(Boolean),
    [password, confirm, errors],
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.message ? (
        <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50 px-4 py-3 text-sm text-rose-800 backdrop-blur-sm dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-200">
          {state.message}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password Baru
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              const v = e.target.value;
              setPassword(v);
              if (touched.password) {
                const err = validate("password", v, confirm);
                setErrors((p) => ({ ...p, password: err }));
              }
              if (touched.confirm_password) {
                const errC = validate("confirm_password", v, confirm);
                setErrors((p) => ({ ...p, confirm_password: errC }));
              }
            }}
            onBlur={() => {
              setTouched((p) => ({ ...p, password: true }));
              const err = validate("password", password, confirm);
              setErrors((p) => ({ ...p, password: err }));
            }}
            className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 pr-12 text-sm text-zinc-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-zinc-400 focus:border-pink-500 focus:bg-white/80 focus:ring-4 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:border-pink-500 dark:focus:bg-white/10"
            placeholder="Minimal 8 karakter"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            {showPassword ? (
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        <PasswordStrength password={password} />
        {touched.password && errors.password ? (
          <p className="mt-1 text-xs text-rose-500">{errors.password}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Konfirmasi Password
        </label>
        <input
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            const v = e.target.value;
            setConfirm(v);
            if (touched.confirm_password) {
              const err = validate("confirm_password", password, v);
              setErrors((p) => ({ ...p, confirm_password: err }));
            }
          }}
          onBlur={() => {
            setTouched((p) => ({ ...p, confirm_password: true }));
            const err = validate("confirm_password", password, confirm);
            setErrors((p) => ({ ...p, confirm_password: err }));
          }}
          className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 text-sm text-zinc-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-zinc-400 focus:border-pink-500 focus:bg-white/80 focus:ring-4 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:border-pink-500 dark:focus:bg-white/10"
          placeholder="Ulangi password"
        />
        {touched.confirm_password && errors.confirm_password ? (
          <p className="mt-1 text-xs text-rose-500">{errors.confirm_password}</p>
        ) : null}
      </div>

      <SubmitButton disabled={disableSubmit} />
    </form>
  );
}
