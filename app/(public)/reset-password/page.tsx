import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Buat Password Baru</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Masukkan password baru untuk akun kamu.
        </p>

        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
