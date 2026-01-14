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
      className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? "Mengirim..." : "Kirim Link Reset Password"}
    </button>
  );
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, formAction] = useActionState<State, FormData>(
    forgotPasswordAction,
    { message: "" }
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.message ? (
        <div
          className={[
            "rounded-xl border px-3 py-2 text-sm",
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200",
          ].join(" ")}
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="nama@email.com"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
