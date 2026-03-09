# Email Templates

## Activation Email (Confirm User)

File: `activation.html`

### Cara Menggunakan di Supabase:
1. Buka **Supabase Dashboard**.
2. Masuk ke menu **Authentication** -> **Email Templates**.
3. Pilih **Confirm User**.
4. Copy-paste isi file `activation.html` ke dalam editor HTML Body.
5. Simpan perubahan.

### Catatan Penting:
- Template ini menggunakan `{{ .SiteURL }}` untuk link konfirmasi. Pastikan **Site URL** di pengaturan **Authentication -> URL Configuration** sudah benar.
- Link akan mengarahkan user ke `/auth/confirm` yang kemudian redirect ke `/login`.
