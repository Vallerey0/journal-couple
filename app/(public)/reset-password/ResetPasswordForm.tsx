"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordAction } from "./actions";

type State = { message?: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? "Menyimpan..." : "Simpan Password Baru"}
    </button>
  );
}

export default function ResetPasswordForm() {
  const [state, formAction] = useActionState<State, FormData>(
    resetPasswordAction,
    { message: "" }
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.message ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
          {state.message}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium">Password Baru</label>
        <input
          name="password"
          type="password"
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="Minimal 8 karakter"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Konfirmasi Password</label>
        <input
          name="confirm_password"
          type="password"
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="Ulangi password"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
