import Link from "next/link";
import ResendActivationForm from "./ResendActivationForm";

type SP = { email?: string };

function decodeParam(v?: string) {
  if (!v) return "";
  return decodeURIComponent(v.replace(/\+/g, " "));
}

export default function ActivatePage({ searchParams }: { searchParams: SP }) {
  const email = decodeParam(searchParams.email);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Cek Email untuk Aktivasi</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Kami sudah mengirim link aktivasi. Setelah klik link, kamu akan
          diarahkan ke halaman login.
        </p>

        {email ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200">
            Dikirim ke: <span className="font-medium">{email}</span>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200">
            Jika kamu baru saja daftar, silakan cek inbox/spam email kamu. Jika
            belum ada, kamu bisa kirim ulang link aktivasi di bawah.
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Link
            href={
              email ? `/login?email=${encodeURIComponent(email)}` : "/login"
            }
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Ke Login
          </Link>

          <Link
            href="/register"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-300 bg-transparent text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            Kembali ke Daftar
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Tidak menemukan emailnya?
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
            <li>1) Cek Inbox (tab Primary/Updates)</li>
            <li>2) Cek Spam/Promotions</li>
            <li>3) Jika belum ada, kirim ulang link aktivasi</li>
          </ul>

          <div className="mt-4">
            {/* ✅ Resend tetap tampil, tapi kalau email kosong minta input */}
            <ResendActivationForm email={email} />
          </div>
        </div>

        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-400">
          Catatan: Link aktivasi biasanya hanya berlaku dalam waktu tertentu.
          Jika sudah kedaluwarsa, kamu bisa kirim ulang dari tombol di atas.
        </p>
      </div>
    </main>
  );
}
