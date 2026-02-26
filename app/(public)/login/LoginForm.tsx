"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";

type State = { message?: string };
type Field = "email" | "password";

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

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40 disabled:opacity-70"
    >
      {pending ? "Memproses..." : "Masuk Sekarang"}
    </button>
  );
}

export default function LoginForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction] = useActionState<State, FormData>(loginAction, {
    message: "",
  });

  const [values, setValues] = useState<Record<Field, string>>({
    email: defaultEmail || "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const focusPassword = useMemo(() => Boolean(defaultEmail), [defaultEmail]);

  useEffect(() => {
    if (defaultEmail) setValues((p) => ({ ...p, email: defaultEmail }));
  }, [defaultEmail]);

  function validate(name: Field, next = values): string {
    const v = (next[name] ?? "").trim();

    if (name === "email") {
      if (!v) return "Email wajib diisi.";
      if (!isEmailValid(v.toLowerCase())) return "Email tidak valid.";
      return "";
    }

    if (name === "password") {
      if (!v) return "Password wajib diisi.";
      return "";
    }

    return "";
  }

  function setField(name: Field, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);

    if (touched[name]) {
      const err = validate(name, next);
      setErrors((p) => ({ ...p, [name]: err }));
    }
  }

  function blurField(name: Field) {
    setTouched((p) => ({ ...p, [name]: true }));
    const err = validate(name);
    setErrors((p) => ({ ...p, [name]: err }));
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.message ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
          {state.message}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => blurField("email")}
          required
          className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 text-sm outline-none backdrop-blur-sm transition-all focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-pink-500/50"
          placeholder="nama@email.com"
        />
        {touched.email && errors.email ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={values.password}
            onChange={(e) => setField("password", e.target.value)}
            onBlur={() => blurField("password")}
            required
            autoFocus={focusPassword}
            autoComplete="current-password"
            className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 pr-12 text-sm outline-none backdrop-blur-sm transition-all focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-pink-500/50"
            placeholder="Password kamu"
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
        {touched.password && errors.password ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            {errors.password}
          </p>
        ) : null}
      </div>

      <SubmitButton />
    </form>
  );
}
