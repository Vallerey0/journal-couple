import Link from "next/link";
import LoginForm from "./LoginForm";
import ResendActivationForm from "../activate/ResendActivationForm";
import LoginClient from "./LoginClient";

type SP = {
  activated?: string;
  already?: string;
  unverified?: string;
  reset?: string;
  email?: string;
  error?: string;
};

function decodeParam(v?: string) {
  if (!v) return "";
  return decodeURIComponent(v.replace(/\+/g, " "));
}

function friendlyError(code: string) {
  const c = (code || "").toLowerCase().trim();

  // jangan tampilkan error teknis mentah
  if (c === "missing_token" || c === "invalid_activation") {
    return "Link aktivasi tidak valid atau sudah kedaluwarsa. Silakan kirim ulang email aktivasi.";
  }
  if (c === "activation_failed") {
    return "Link aktivasi tidak valid atau sudah kedaluwarsa. Silakan kirim ulang email aktivasi.";
  }

  // jika memang kamu sengaja kirim pesan error custom
  return code;
}

function shouldShowResend(email: string, unverified: boolean) {
  // ✅ hanya saat belum aktivasi
  return Boolean(email) && unverified;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const activated = sp.activated === "1";
  const already = sp.already === "1";
  const unverified = sp.unverified === "1";
  const resetOk = sp.reset === "1";

  const email = decodeParam(sp.email);
  const errorMsgRaw = decodeParam(sp.error);
  const errorMsg = friendlyError(errorMsgRaw);

  const showResend = shouldShowResend(email, unverified);

  return (
    <LoginClient>
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-3xl font-bold text-transparent">
          Selamat Datang
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Masuk untuk melanjutkan kisah kalian.
        </p>
      </div>

      {/* Error (ramah user) */}
      {errorMsg ? (
        <div className="mb-6 rounded-2xl border border-rose-200/50 bg-rose-50/50 px-4 py-3 text-sm text-rose-800 backdrop-blur-sm dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-200">
          {errorMsg}
        </div>
      ) : null}

      {/* Akun sudah aktif */}
      {already ? (
        <div className="mb-6 rounded-2xl border border-amber-200/50 bg-amber-50/50 px-4 py-3 text-sm text-amber-800 backdrop-blur-sm dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-200">
          Akun kamu sudah aktif. Silakan login.
        </div>
      ) : null}

      {/* Baru selesai aktivasi */}
      {activated && !already ? (
        <div className="mb-6 rounded-2xl border border-emerald-200/50 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800 backdrop-blur-sm dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-200">
          Akun berhasil diaktivasi. Silakan login.
        </div>
      ) : null}

      {/* Belum aktivasi */}
      {unverified ? (
        <div className="mb-6 rounded-2xl border border-rose-200/50 bg-rose-50/50 px-4 py-3 text-sm text-rose-800 backdrop-blur-sm dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-200">
          Akun belum diaktivasi. Silakan cek email aktivasi.
        </div>
      ) : null}

      {/* Reset password sukses */}
      {resetOk ? (
        <div className="mb-6 rounded-2xl border border-emerald-200/50 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800 backdrop-blur-sm dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-200">
          Password berhasil diubah. Silakan login.
        </div>
      ) : null}

      {/* ✅ Resend activation: hanya saat unverified */}
      {showResend ? (
        <div className="mb-6 rounded-2xl border border-zinc-200/50 bg-white/50 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-300">
            Belum menerima email aktivasi? Kirim ulang link aktivasi ke:
            <span className="ml-1 font-medium text-zinc-900 dark:text-white">
              {email}
            </span>
          </p>
          <ResendActivationForm email={email} compact />
        </div>
      ) : null}

      <div className="mt-6">
        <LoginForm defaultEmail={email} />
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Lupa password?
        </Link>
        <Link
          href="/register"
          className="font-medium text-pink-600 transition-colors hover:text-pink-500 dark:text-pink-400 dark:hover:text-pink-300"
        >
          Buat akun baru
        </Link>
      </div>
    </LoginClient>
  );
}
