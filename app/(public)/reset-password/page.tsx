import ResetPasswordForm from "./ResetPasswordForm";
import LoginClient from "../login/LoginClient";

export default function ResetPasswordPage() {
  return (
    <LoginClient>
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-3xl font-bold text-transparent">
          Buat Password Baru
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Masukkan password baru untuk akun kamu.
        </p>
      </div>

      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </LoginClient>
  );
}
