import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Kebijakan Privasi Journal Couple tentang cara kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pengguna.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
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
                href="/terms-of-service"
                className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                Terms
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
                Privacy Policy
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
              Kebijakan privasi ini menjelaskan data apa yang dikumpulkan, untuk
              apa digunakan, dan bagaimana kami menjaga keamanan data Anda.
            </p>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Terakhir diperbarui: 11 Maret 2026
            </p>
          </header>

          <section className="mt-12 rounded-[2rem] border border-white/50 bg-white/80 px-10 py-12 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/40">
            <div className="prose prose-zinc dark:prose-invert max-w-none text-justify leading-relaxed prose-p:my-4 prose-p:indent-6 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-h2:mt-14 prose-h2:mb-4 prose-h2:text-3xl prose-h2:font-bold prose-h2:tracking-tight prose-ul:my-4 prose-ul:pl-6 prose-li:my-1 prose-strong:font-semibold">
              <h2>1. Pendahuluan</h2>
              <p>
                Journal Couple adalah layanan berbasis web untuk membantu
                pasangan menyimpan foto, cerita, dan perjalanan mereka dalam
                jurnal digital pribadi.
              </p>

              <h2>2. Data yang Dikumpulkan</h2>
              <p>Kami dapat mengumpulkan data berikut:</p>
              <ul>
                <li>
                  <strong>Informasi akun.</strong> Email dan data profil yang
                  Anda isi saat menggunakan layanan.
                </li>
                <li>
                  <strong>Konten yang Anda unggah.</strong> Foto, judul/catatan
                  jurnal, serta musik yang Anda tambahkan.
                </li>
                <li>
                  <strong>Informasi penggunaan layanan.</strong> Aktivitas di
                  aplikasi, seperti membuat, mengubah, atau menghapus konten.
                </li>
                <li>
                  <strong>Informasi transaksi.</strong> Status pembayaran atau
                  langganan (tanpa menyimpan data kartu pembayaran).
                </li>
              </ul>

              <h2>3. Penggunaan Data</h2>
              <p>Kami menggunakan data untuk:</p>
              <ul>
                <li>
                  Menyediakan layanan dan fitur aplikasi (jurnal, galeri, musik,
                  dan lainnya).
                </li>
                <li>Mengelola akun dan pengalaman pengguna.</li>
                <li>
                  Meningkatkan kualitas, keamanan, dan stabilitas layanan.
                </li>
                <li>Mengelola langganan premium dan akses fitur.</li>
              </ul>

              <h2>4. Penyimpanan dan Keamanan Data</h2>
              <p>
                Data akun dan data aplikasi disimpan di database yang dikelola
                melalui Supabase (PostgreSQL dan sistem autentikasi).
              </p>
              <p>
                File media (misalnya foto dan musik) disimpan di penyimpanan
                objek (object storage) menggunakan Cloudflare R2
                (S3-compatible).
              </p>
              <p>
                Kami berupaya melindungi data pengguna dengan langkah keamanan
                yang sesuai standar industri, termasuk kontrol akses dan
                pembatasan akses terhadap data yang dilindungi.
              </p>

              <h2>5. Layanan Pihak Ketiga</h2>
              <p>Layanan ini dapat menggunakan pihak ketiga berikut:</p>
              <ul>
                <li>
                  <strong>Supabase.</strong> Autentikasi dan penyimpanan data
                  aplikasi.
                </li>
                <li>
                  <strong>Cloudflare R2.</strong> Penyimpanan file media (foto
                  dan musik).
                </li>
                <li>
                  <strong>Midtrans.</strong> Payment gateway untuk memproses
                  pembayaran. Data pembayaran diproses oleh Midtrans dan tidak
                  disimpan langsung oleh sistem kami.
                </li>
              </ul>

              <h2>6. Hak Pengguna</h2>
              <p>
                Anda dapat meminta pembaruan atau penghapusan data dengan
                menghubungi kami melalui email pada bagian Kontak.
              </p>

              <h2>7. Perubahan Kebijakan</h2>
              <p>
                Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Jika ada
                perubahan, kami akan memperbarui halaman ini beserta tanggal
                pembaruan terbaru.
              </p>

              <h2>8. Kontak</h2>
              <p>
                Jika Anda memiliki pertanyaan terkait kebijakan privasi ini,
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
