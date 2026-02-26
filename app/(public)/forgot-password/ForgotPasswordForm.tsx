"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { forgotPasswordAction } from "./actions";

type State = { message?: string; ok?: boolean };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40 disabled:opacity-70"
    >
      {pending ? "Mengirim..." : "Kirim Link Reset Password"}
    </button>
  );
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, formAction] = useActionState<State, FormData>(
    forgotPasswordAction,
    { message: "" },
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.message ? (
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm transition-all",
            state.ok
              ? "border-emerald-200/50 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-200"
              : "border-rose-200/50 bg-rose-50/50 text-rose-800 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-200",
          ].join(" ")}
        >
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
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-12 w-full rounded-xl border border-zinc-200/50 bg-white/50 px-4 text-sm text-zinc-900 shadow-sm backdrop-blur-sm transition-all placeholder:text-zinc-400 focus:border-pink-500 focus:bg-white/80 focus:ring-4 focus:ring-pink-500/10 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:focus:border-pink-500 dark:focus:bg-white/10"
          placeholder="nama@email.com"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
