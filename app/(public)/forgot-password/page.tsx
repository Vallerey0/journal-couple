import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Lupa Password</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Masukkan email kamu, nanti kami kirim link reset password.
        </p>

        <div className="mt-6">
          <ForgotPasswordForm />
        </div>

        <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          <Link
            href="/login"
            className="font-medium text-zinc-900 dark:text-white"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </main>
  );
}
