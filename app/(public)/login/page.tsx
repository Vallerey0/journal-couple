import Link from "next/link";
import LoginForm from "./LoginForm";
import ResendActivationForm from "../activate/ResendActivationForm";

type SP = {
  activated?: string;
  already?: string;
  unverified?: string; // ✅ baru
  reset?: string;
  email?: string;
  error?: string;
};

function decodeParam(v?: string) {
  if (!v) return "";
  return decodeURIComponent(v.replace(/\+/g, " "));
}

function shouldShowResend(
  email: string,
  already: boolean,
  unverified: boolean,
  errorMsg: string
) {
  if (!email) return false;
  if (already || unverified) return true;

  const e = (errorMsg || "").toLowerCase();
  return (
    e.includes("aktivasi") ||
    e.includes("verifikasi") ||
    e.includes("confirm") ||
    e.includes("confirmed") ||
    e.includes("not confirmed") ||
    e.includes("email not confirmed") ||
    e.includes("not verified") ||
    e.includes("verify")
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const already = sp.already === "1";
  const activated = sp.activated === "1";
  const unverified = sp.unverified === "1"; // ✅ baru
  const resetOk = sp.reset === "1";
  const email = decodeParam(sp.email);
  const errorMsg = decodeParam(sp.error);

  const showResend = shouldShowResend(email, already, unverified, errorMsg);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Masuk untuk lanjut ke Journal Couple.
        </p>

        {errorMsg ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
            {errorMsg}
          </div>
        ) : null}

        {already ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
            Akun kamu sudah aktif. Silakan login.
          </div>
        ) : null}

        {activated && !already ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            Akun berhasil diaktivasi. Silakan login.
          </div>
        ) : null}

        {unverified ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
            Akun belum diaktivasi. Silakan cek email aktivasi.
          </div>
        ) : null}

        {resetOk ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            Password berhasil diubah. Silakan login.
          </div>
        ) : null}

        {/* ✅ Resend activation */}
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
