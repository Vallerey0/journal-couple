import Link from "next/link";
import RegisterForm from "./RegisterForm";
import LoginClient from "../login/LoginClient";

export default function RegisterPage() {
  return (
    <LoginClient>
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-3xl font-bold text-transparent">
          Buat Akun
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Daftar dulu, lalu cek email untuk aktivasi.
        </p>
      </div>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-pink-600 hover:text-pink-500 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"
        >
          Login
        </Link>
      </div>
    </LoginClient>
  );
}
