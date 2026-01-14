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
      className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? "Memproses..." : "Daftar & Kirim Email Aktivasi"}
    </button>
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
    <form action={formAction} className="space-y-4">
      {/* alert global kecil untuk error server */}
      {serverHumanMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
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
        <label className="text-sm font-medium">Nama Lengkap</label>
        <input
          name="full_name"
          value={values.full_name}
          onChange={(e) => setField("full_name", e.target.value)}
          onBlur={() => blurField("full_name")}
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="Nama kamu"
        />
        {touched.full_name && errors.full_name ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            {errors.full_name}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={blurEmail}
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="nama@email.com"
        />
        {checkingEmail ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Mengecek email...
          </p>
        ) : null}
        {touched.email && errors.email ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium">Nomor HP</label>
        <input
          name="phone"
          type="tel"
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          onBlur={() => blurField("phone")}
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="08xxxxxxxxxx"
        />
        {touched.phone && errors.phone ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            {errors.phone}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={(e) => setField("password", e.target.value)}
          onBlur={() => blurField("password")}
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="Minimal 8 karakter"
        />
        {touched.password && errors.password ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            {errors.password}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium">Konfirmasi Password</label>
        <input
          name="confirm_password"
          type="password"
          value={values.confirm_password}
          onChange={(e) => setField("confirm_password", e.target.value)}
          onBlur={() => blurField("confirm_password")}
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="Ulangi password"
        />
        {touched.confirm_password && errors.confirm_password ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            {errors.confirm_password}
          </p>
        ) : null}
      </div>

      <SubmitButton disabled={disableSubmit} />
    </form>
  );
}
