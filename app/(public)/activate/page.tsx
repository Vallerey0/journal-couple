import Link from "next/link";
import ResendActivationForm from "./ResendActivationForm";
import LoginClient from "../login/LoginClient";

type SP = { email?: string };

function decodeParam(v?: string) {
  if (!v) return "";
  return decodeURIComponent(v.replace(/\+/g, " "));
}

export default function ActivatePage({ searchParams }: { searchParams: SP }) {
  const email = decodeParam(searchParams.email);

  return (
    <LoginClient>
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-3xl font-bold text-transparent">
          Cek Email untuk Aktivasi
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Kami sudah mengirim link aktivasi. Setelah klik link, kamu akan
          diarahkan ke halaman login.
        </p>
      </div>

      <div className="space-y-6">
        {email ? (
          <div className="rounded-2xl border border-zinc-200/50 bg-white/50 px-4 py-3 text-sm text-zinc-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
            Dikirim ke: <span className="font-medium">{email}</span>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200/50 bg-white/50 px-4 py-3 text-sm text-zinc-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
            Jika kamu baru saja daftar, silakan cek inbox/spam email kamu. Jika
            belum ada, kamu bisa kirim ulang link aktivasi di bawah.
          </div>
        )}

        <div className="space-y-3">
          <Link
            href={
              email ? `/login?email=${encodeURIComponent(email)}` : "/login"
            }
            className="group inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-medium text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] hover:shadow-pink-500/40"
          >
            Ke Login
          </Link>

          <Link
            href="/register"
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-zinc-200/50 bg-white/30 text-sm font-medium text-zinc-700 backdrop-blur-sm transition-all hover:bg-white/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Kembali ke Daftar
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200/50 bg-white/30 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Tidak menemukan emailnya?
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
            <li>1) Cek Inbox (tab Primary/Updates)</li>
            <li>2) Cek Spam/Promotions</li>
            <li>3) Jika belum ada, kirim ulang link aktivasi</li>
          </ul>

          <div className="mt-4">
            {/* ✅ Resend tetap tampil, tapi kalau email kosong minta input */}
            <ResendActivationForm email={email} />
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Catatan: Link aktivasi biasanya hanya berlaku dalam waktu tertentu.
          Jika sudah kedaluwarsa, kamu bisa kirim ulang dari tombol di atas.
        </p>
      </div>
    </LoginClient>
  );
}
