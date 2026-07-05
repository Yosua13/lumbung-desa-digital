# Analisis Sistem Login, Role, dan UI/UX

## 1. Sistem Login dan Autentikasi Saat Ini
*   **Alur Login**: Pengguna melakukan koneksi melalui Freighter Wallet. API `ConnectWallet` akan mengecek wallet tersebut di database. Jika tidak ada, sistem akan langsung membuat *user* baru dan *warung* baru dengan role default `warung`.
*   **Masalah Identifikasi**: Sistem di *frontend* (React) saat ini menggunakan *tab* statis di atas (Warung, Supplier, Funder) untuk berpindah tampilan. Siapapun yang terhubung bisa melihat tampilan role lain dengan menekan tab tersebut, yang berarti **tidak ada pembatasan akses berbasis role yang sebenarnya (Role-Based Access Control)**.
*   **Manajemen Sesi (Logout)**: Belum ada alur *Logout* yang jelas untuk memutus sesi secara keseluruhan.
*   **Link Demo Wallet**: Terdapat mekanisme "Hackathon Demo Banner" yang mengizinkan pemaksaan penautan wallet ke profil seeded, yang seharusnya tidak ada pada implementasi *production*.

## 2. Kebutuhan Panel Admin (Role Management)
*   **Kondisi Saat Ini**: Role ditentukan pada saat *seeding* database atau ketika user baru login (langsung menjadi `warung`). Tidak ada cara dinamis untuk merubah role user (misal, mendaftarkan sebuah wallet menjadi `supplier` atau `funder`).
*   **Kebutuhan**: Diperlukan sebuah **Admin Panel** di mana user dengan role `admin` dapat melihat seluruh daftar pengguna yang terdaftar di sistem dan mengubah role mereka secara dinamis melalui UI. API backend juga perlu diperbarui untuk menyediakan endpoint merubah role ini.

## 3. Evaluasi UI/UX
*   **Visual**: Tampilan aplikasi saat ini masih sangat dasar. CSS yang ada (`index.css` dan `App.css`) bersifat fungsional namun tidak elegan.
*   **Interaktivitas**: Kurangnya *micro-animations* dan *feedback* visual yang jelas saat interaksi (hover, klik, loading) membuat *user experience* terasa kaku.
*   **Pembaruan yang Dibutuhkan**: Dibutuhkan perombakan CSS menggunakan standar desain web modern (misalnya, pemanfaatan *Glassmorphism*, gradien warna yang elegan, tipografi modern seperti `Inter` atau `Outfit`, serta transisi yang halus). 

## 4. Rencana End-to-End
1.  **Implementasi Auth Context**: Membungkus aplikasi dengan *Context Provider* untuk menyimpan status login secara global.
2.  **Role-Based Routing**: Mengganti tab manual dengan sistem routing otomatis. Jika yang login adalah `warung`, maka hanya akan merender `WarungPages`. Jika `admin`, maka akan merender `AdminPages`.
3.  **Fitur Logout**: Menambahkan tombol *Disconnect/Logout* yang akan membersihkan state dan mengembalikan ke layar login.
4.  **Admin Panel Terintegrasi**: Mengembangkan UI untuk Admin agar bisa merubah role user, didukung dengan API `PUT /admin/users/:id/role`.
5.  **Revamp Tampilan**: Mendesain ulang struktur UI agar lebih *wow*, profesional, dan intuitif.
