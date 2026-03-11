import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Syarat dan Ketentuan penggunaan layanan Journal Couple, termasuk aturan akun, konten pengguna, langganan premium, dan pembayaran melalui Midtrans.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsOfServicePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-900 selection:bg-pink-500/30 dark:bg-zinc-950 dark:text-zinc-50">
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[700px] w-[700px] rounded-full bg-pink-500/20 blur-[120px] dark:bg-pink-900/20" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[700px] w-[700px] rounded-full bg-purple-500/20 blur-[120px] dark:bg-purple-900/20" />
        <div className="absolute top-[40%] left-[30%] h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-900/10" />
      </div>

      <main className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <span aria-hidden>←</span>
              <span>Kembali</span>
            </Link>

            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/privacy-policy"
                className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-zinc-200 bg-white/50 px-4 py-2 text-zinc-800 shadow-sm backdrop-blur-sm hover:bg-white/80 dark:border-zinc-800 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 transition-colors"
              >
                Buat Akun
              </Link>
            </div>
          </div>

          <header className="mt-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-pink-200/50 bg-white/50 px-4 py-1.5 text-sm font-medium text-pink-600 backdrop-blur-md dark:border-pink-800/50 dark:bg-white/5 dark:text-pink-300">
              Journal Couple
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Terms of Service
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
              Syarat dan ketentuan ini menjelaskan aturan penggunaan layanan,
              tanggung jawab pengguna, serta ketentuan langganan premium.
            </p>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Terakhir diperbarui: 11 Maret 2026
            </p>
          </header>

          <section className="mt-12 rounded-[2rem] border border-white/50 bg-white/80 px-10 py-12 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/40">
            <div className="prose prose-zinc dark:prose-invert max-w-none text-justify leading-relaxed prose-p:my-4 prose-p:indent-6 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-h2:mt-14 prose-h2:mb-4 prose-h2:text-3xl prose-h2:font-bold prose-h2:tracking-tight prose-ul:my-4 prose-ul:pl-6 prose-li:my-1 prose-strong:font-semibold">
              <h2>1. Pengantar</h2>
              <p>
                Dengan menggunakan layanan Journal Couple, Anda menyetujui
                syarat dan ketentuan yang tercantum pada halaman ini.
              </p>

              <h2>2. Penggunaan Layanan</h2>
              <ul>
                <li>
                  <strong>Akun.</strong> Pengguna perlu membuat akun untuk
                  menggunakan fitur utama.
                </li>
                <li>
                  <strong>Konten.</strong> Pengguna bertanggung jawab atas
                  konten yang diunggah, termasuk foto, tulisan, dan musik.
                </li>
                <li>
                  <strong>Larangan.</strong> Dilarang menggunakan layanan untuk
                  aktivitas yang melanggar hukum atau merugikan pihak lain.
                </li>
              </ul>

              <h2>3. Akun Pengguna</h2>
              <ul>
                <li>
                  Pengguna bertanggung jawab menjaga kerahasiaan kredensial
                  akun.
                </li>
                <li>
                  Jika Anda mencurigai akses tidak sah, segera amankan akun Anda
                  dan hubungi kami.
                </li>
              </ul>

              <h2>4. Langganan Premium</h2>
              <p>
                Journal Couple menyediakan fitur premium berbasis langganan
                untuk memberikan akses ke fitur tambahan.
              </p>

              <h2>5. Pembayaran</h2>
              <p>
                Pembayaran diproses melalui penyedia payment gateway pihak
                ketiga yaitu Midtrans.
              </p>
              <p>
                Journal Couple tidak menyimpan informasi kartu pembayaran
                pengguna. Kami hanya menyimpan data yang diperlukan untuk
                pencatatan transaksi (misalnya status pembayaran atau
                langganan).
              </p>

              <h2>6. Pembatalan</h2>
              <p>
                Langganan premium berlaku sesuai periode yang dipilih pengguna.
                Jika ada pertanyaan terkait pembatalan atau status langganan,
                silakan hubungi kami.
              </p>

              <h2>7. Pembatasan Tanggung Jawab</h2>
              <p>
                Kami tidak bertanggung jawab atas kerugian yang timbul dari
                penggunaan layanan secara tidak tepat, termasuk kehilangan akses
                akibat kelalaian pengguna menjaga keamanan akun.
              </p>

              <h2>8. Perubahan Layanan</h2>
              <p>
                Layanan dapat diperbarui atau diubah sewaktu-waktu untuk
                meningkatkan kualitas, keamanan, atau menambah fitur.
              </p>

              <h2>9. Kontak</h2>
              <p>
                Jika Anda memiliki pertanyaan terkait syarat layanan ini,
                silakan hubungi{" "}
                <a href="mailto:support@journalcouple.com">
                  support@journalcouple.com
                </a>
                .
              </p>
            </div>
          </section>

          <footer className="mt-14 border-t border-zinc-200 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800">
            <div className="flex justify-center gap-6">
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms-of-service">Terms of Service</Link>
            </div>

            <p className="mt-4">
              © {new Date().getFullYear()} Journal Couple. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
