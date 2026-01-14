import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <div className="flex flex-col gap-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Journal Couple
        </div>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Jurnal pasangan yang rapi, aman, dan gampang dipakai.
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-300">
          Daftar, aktivasi lewat email, lalu login manual.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-base font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Buat Akun
          </Link>

          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-base font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
