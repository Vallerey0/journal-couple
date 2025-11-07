# 💖 Journal Couple

**Journal Couple** adalah aplikasi web modern yang dirancang untuk pasangan agar dapat menyimpan momen kebersamaan mereka — mulai dari profil pasangan, ramalan zodiak, hobi, perjalanan (traveling), hingga galeri foto dan musik kenangan.

Aplikasi ini juga mendukung sistem pembayaran otomatis (Midtrans) bagi pengguna yang ingin membeli akun premium untuk mendapatkan fitur penuh.

---

## 🚀 Tech Stack

| Layer | Teknologi |
|-------|------------|
| **Frontend** | [Next.js 14 (App Router)](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Payment Gateway** | [Midtrans Snap API](https://docs.midtrans.com/) |
| **Auth** | [NextAuth.js (Credentials)](https://next-auth.js.org/) |
| **Hosting** | [Vercel](https://vercel.com/) + [Neon Database](https://neon.tech/) / [Supabase](https://supabase.com/) |

---

## ✨ Fitur Utama

- 💑 **Data Pasangan** — simpan nama, tanggal jadian, dan ramalan zodiak otomatis  
- 🎨 **Galeri & Musik** — upload foto dan lagu kenangan bersama  
- 🧳 **Traveling Log** — catat perjalanan dan lokasi favorit  
- 💳 **Pembayaran Otomatis (Midtrans)** — pengguna bisa membeli akun berbayar  
- 🔐 **Login Aman** — menggunakan NextAuth dengan password terenkripsi  
- ☁️ **Upload Media ke Cloud** — support Cloudinary / S3  
- 📅 **Dashboard Pribadi** — menampilkan profil dan kenangan pasangan  

---

## 🛠️ Cara Install (Development)

### 1️⃣ Clone repository
```bash
git clone https://github.com/Vallerey0/journal-couple.git
cd journal-couple
