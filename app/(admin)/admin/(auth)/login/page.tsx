import Link from "next/link";
import AdminLoginForm from "./AdminLoginForm";

type SP = { next?: string; error?: string; email?: string };

function decodeParam(v?: string) {
  if (!v) return "";
  return decodeURIComponent(v.replace(/\+/g, " "));
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const next = decodeParam(sp.next) || "/admin";
  const errorMsg = decodeParam(sp.error);
  const email = decodeParam(sp.email);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Admin Login</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Khusus admin Journal Couple.
        </p>

        {errorMsg ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
            {errorMsg}
          </div>
        ) : null}

        <div className="mt-6">
          <AdminLoginForm defaultEmail={email} next={next} />
        </div>

        <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          Kembali ke{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 hover:underline dark:text-white"
          >
            login user
          </Link>
        </div>
      </div>
    </main>
  );
}
