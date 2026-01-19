import Link from "next/link";
import LoginForm from "./LoginForm";
import ResendActivationForm from "../activate/ResendActivationForm";

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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Masuk untuk lanjut ke Journal Couple.
        </p>

        {/* Error (ramah user) */}
        {errorMsg ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
            {errorMsg}
          </div>
        ) : null}

        {/* Akun sudah aktif */}
        {already ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            Akun kamu sudah aktif. Silakan login.
          </div>
        ) : null}

        {/* Baru selesai aktivasi */}
        {activated && !already ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            Akun berhasil diaktivasi. Silakan login.
          </div>
        ) : null}

        {/* Belum aktivasi */}
        {unverified ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
            Akun belum diaktivasi. Silakan cek email aktivasi.
          </div>
        ) : null}

        {/* Reset password sukses */}
        {resetOk ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            Password berhasil diubah. Silakan login.
          </div>
        ) : null}

        {/* ✅ Resend activation: hanya saat unverified */}
        {showResend ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-sm text-zinc-700 dark:text-zinc-200">
              Belum menerima email aktivasi? Kirim ulang link aktivasi ke:
              <span className="ml-1 font-medium">{email}</span>
            </p>
            <ResendActivationForm email={email} compact />
          </div>
        ) : null}

        <div className="mt-6">
          <LoginForm defaultEmail={email} />
        </div>

        <div className="mt-4 text-sm">
          <Link
            href="/forgot-password"
            className="text-zinc-600 hover:underline dark:text-zinc-300"
          >
            Lupa password?
          </Link>
        </div>

        <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-900 hover:underline dark:text-white"
          >
            Buat akun
          </Link>
        </div>
      </div>
    </main>
  );
}
