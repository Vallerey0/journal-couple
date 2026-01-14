"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { adminLoginAction } from "./actions";

type State = { message?: string };
type Field = "email" | "password";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? "Memproses..." : "Login Admin"}
    </button>
  );
}

export default function AdminLoginForm({
  defaultEmail,
  next,
}: {
  defaultEmail?: string;
  next?: string;
}) {
  const [state, formAction] = useActionState<State, FormData>(
    adminLoginAction,
    {
      message: "",
    }
  );

  const [values, setValues] = useState<Record<Field, string>>({
    email: defaultEmail || "",
    password: "",
  });

  useEffect(() => {
    if (defaultEmail) setValues((p) => ({ ...p, email: defaultEmail }));
  }, [defaultEmail]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next || "/admin"} />

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
          onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="admin@email.com"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={(e) =>
            setValues((p) => ({ ...p, password: e.target.value }))
          }
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-transparent px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          placeholder="Password admin"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
