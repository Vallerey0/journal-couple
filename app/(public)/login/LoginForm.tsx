"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";

type State = { message?: string };
type Field = "email" | "password";

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? "Memproses..." : "Login"}
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
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => blurField("email")}
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="nama@email.com"
        />
        {touched.email && errors.email ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            {errors.email}
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
          placeholder="Password kamu"
        />
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
