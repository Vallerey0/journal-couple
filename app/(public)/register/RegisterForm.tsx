"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "./actions";

type State = { message?: string };
type Field = "full_name" | "email" | "phone" | "password" | "confirm_password";
type FieldErrors = Partial<Record<Field, string>>;
type FieldTouched = Partial<Record<Field, boolean>>;

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="group mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40 disabled:opacity-70"
    >
      {pending ? "Memproses..." : "Daftar & Kirim Email Aktivasi"}
    </button>
  );
}

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

export default function RegisterForm() {
  const [state, formAction] = useActionState<State, FormData>(registerAction, {
    message: "",
  });

  const [values, setValues] = useState<Record<Field, string>>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<FieldTouched>({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const serverMessage = state?.message || "";
  const emailExistsFromServer = serverMessage === "EMAIL_EXISTS";

  const serverHumanMessage = useMemo(() => {
    if (!serverMessage) return "";
    if (emailExistsFromServer)
      return "Email ini sudah terdaftar. Silakan login.";
    return serverMessage;
  }, [serverMessage, emailExistsFromServer]);

  function validate(name: Field, nextValues = values): string {
    const v = (nextValues[name] ?? "").trim();

    if (name === "full_name") {
      if (!v) return "Nama wajib diisi.";
      if (v.length < 2) return "Nama terlalu pendek.";
      return "";
    }

    if (name === "email") {
      if (!v) return "Email wajib diisi.";
      if (!isEmailValid(v.toLowerCase())) return "Email tidak valid.";
      return "";
    }

    if (name === "phone") {
      const p = normalizePhone(v);
      if (!p) return "Nomor HP wajib diisi.";
      if (p.length < 10) return "Nomor HP tidak valid.";
      return "";
    }

    if (name === "password") {
      if (!v) return "Password wajib diisi.";
      if (v.length < 8) return "Minimal 8 karakter.";
      return "";
    }

    if (name === "confirm_password") {
      if (!v) return "Konfirmasi password wajib diisi.";
      if (v !== (nextValues.password || ""))
        return "Konfirmasi password tidak sama.";
      return "";
    }

    return "";
  }

  function setField(name: Field, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);

    // realtime validation kalau field sudah pernah disentuh
    if (touched[name]) {
      const err = validate(name, next);
      setErrors((p) => ({ ...p, [name]: err }));
    }

    // jika password berubah dan confirm sudah disentuh, revalidate confirm
    if (name === "password" && touched.confirm_password) {
      const errConfirm = validate("confirm_password", next);
      setErrors((p) => ({ ...p, confirm_password: errConfirm }));
    }
  }

  function blurField(name: Field) {
    setTouched((p) => ({ ...p, [name]: true }));
    const err = validate(name);
    setErrors((p) => ({ ...p, [name]: err }));
  }

  async function checkEmailExists(email: string) {
    setCheckingEmail(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) return false;

      const data = (await res.json()) as { exists?: boolean };
      return Boolean(data.exists);
    } catch {
      return false;
    } finally {
      setCheckingEmail(false);
    }
  }

  async function blurEmail() {
    setTouched((p) => ({ ...p, email: true }));

    // 1) validasi format dulu
    const err = validate("email");
    setErrors((p) => ({ ...p, email: err }));
    if (err) return;

    // 2) cek ke server apakah sudah terdaftar
    const exists = await checkEmailExists(values.email);
    if (exists) {
      setErrors((p) => ({
        ...p,
        email: "Email sudah terdaftar. Silakan login.",
      }));
    }
  }

  const hasAnyClientError = Object.values(errors).some(Boolean);
  const disableSubmit = hasAnyClientError || checkingEmail;

  return (
    <form action={formAction} className="space-y-5">
      {/* alert global kecil untuk error server */}
      {serverHumanMessage ? (
        <div className="rounded-2xl border border-rose-200/50 bg-rose-50/50 px-4 py-3 text-sm text-rose-800 backdrop-blur-sm dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-200">
          <div>{serverHumanMessage}</div>

          {emailExistsFromServer ? (
            <div className="mt-1">
              <Link
                href={`/login?email=${encodeURIComponent(values.email)}`}
                className="font-medium underline"
              >
                Login dengan email ini
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nama Lengkap
        </label>
        <input
          name="full_name"
          value={values.full_name}
          onChange={(e) => setField("full_name", e.target.value)}
          onBlur={() => blurField("full_name")}
          required
          className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 text-sm text-zinc-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-zinc-400 focus:border-pink-500 focus:bg-white/80 focus:ring-4 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:border-pink-500 dark:focus:bg-white/10"
          placeholder="Nama kamu"
        />
        {touched.full_name && errors.full_name ? (
          <p className="mt-1 text-xs text-rose-500">{errors.full_name}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={blurEmail}
          required
          className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 text-sm text-zinc-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-zinc-400 focus:border-pink-500 focus:bg-white/80 focus:ring-4 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:border-pink-500 dark:focus:bg-white/10"
          placeholder="nama@email.com"
        />
        {checkingEmail ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Mengecek email...
          </p>
        ) : null}
        {touched.email && errors.email ? (
          <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nomor HP
        </label>
        <input
          name="phone"
          type="tel"
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          onBlur={() => blurField("phone")}
          required
          className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 text-sm text-zinc-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-zinc-400 focus:border-pink-500 focus:bg-white/80 focus:ring-4 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:border-pink-500 dark:focus:bg-white/10"
          placeholder="08xxxxxxxxxx"
        />
        {touched.phone && errors.phone ? (
          <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>
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
            autoComplete="new-password"
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
        <PasswordStrength password={values.password} />
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
          value={values.confirm_password}
          onChange={(e) => setField("confirm_password", e.target.value)}
          onBlur={() => blurField("confirm_password")}
          required
          autoComplete="new-password"
          className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 text-sm text-zinc-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-zinc-400 focus:border-pink-500 focus:bg-white/80 focus:ring-4 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:border-pink-500 dark:focus:bg-white/10"
          placeholder="Ulangi password"
        />
        {touched.confirm_password && errors.confirm_password ? (
          <p className="mt-1 text-xs text-rose-500">
            {errors.confirm_password}
          </p>
        ) : null}
      </div>

      <SubmitButton disabled={disableSubmit} />
    </form>
  );
}
