# 🌾 Lumbung Desa Digital

**Lumbung Desa Digital** adalah platform *Peer-to-Peer (P2P) Micro-lending* berbasis komunitas (RT/RW, Desa, atau Paguyuban) yang mengadaptasi kearifan lokal "Gotong Royong". Dibangun di atas jaringan **Stellar** dan *smart contract* **Soroban**, platform ini menyediakan fasilitas pinjaman **tanpa bunga (zero-interest)** yang aman, transparan, dan bebas dari jerat pinjaman online (pinjol) ilegal.

## ⚠️ Latar Belakang Masalah
Di Indonesia, masyarakat menengah ke bawah sering kesulitan mendapatkan akses kredit perbankan (unbanked/underbanked). Ketika terjadi keadaan darurat, mereka terpaksa beralih ke rentenir atau "pinjol ilegal" dengan bunga mencekik. 
Sistem kas warga/arisan konvensional berbasis uang tunai rentan terhadap kehilangan, ketidaksesuaian pencatatan, dan risiko uang dibawa kabur oleh pengurus.

## 💡 Solusi Kami
Menggabungkan kearifan lokal dengan keamanan Web3:
1. **Zero-Interest Lending:** Warga meminjam dana dari kas bersama (lumbung) dan mengembalikan jumlah yang persis sama. Tidak ada bunga.
2. **Kader Digital (Gatekeeper):** Penggunaan antarmuka diwakili/dibantu oleh anak muda pengurus desa yang melek teknologi, menjembatani *gap* literasi Web3.
3. **Smart Contract Soroban:** Dana kas dikunci di *blockchain* Stellar. Pencairan pinjaman harus divalidasi oleh *smart contract* dan disetujui oleh Kader Digital, menghilangkan risiko penipuan/penggelapan dana.

## 🛠 Tech Stack
* **Smart Contract:** Rust (Soroban)
* **Jaringan:** Stellar Testnet
* **Frontend:** Vanilla HTML, CSS, JavaScript (ES Modules)
* **Wallet Connection:** Freighter Wallet (`@stellar/freighter-api`)
* **Blockchain Interaction:** Stellar SDK (`@stellar/stellar-sdk`)

---

## 📊 Diagram Arsitektur & Alur Pengguna

Berikut adalah diagram sederhana bagaimana warga, Kader Digital, dan *smart contract* berinteraksi di dalam ekosistem Lumbung Desa:

```mermaid
sequenceDiagram
    actor Warga as Warga (Peminjam/Penabung)
    actor Kader as Kader Digital (Admin)
    participant UI as Frontend (Lumbung App)
    participant Wallet as Freighter Wallet
    participant Contract as Soroban Contract

    %% Alur Menabung / Deposit
    Warga->>UI: Serahkan dana ke Kader / Input Nominal
    UI->>Wallet: Request Sign Transaction (Menabung)
    Wallet-->>Warga: Prompt Approval
    Warga->>Wallet: Klik "Approve"
    Wallet->>Contract: Simpan dana (USDC/XLM) ke Kas Lumbung
    Contract-->>UI: Return Tx Hash (Sukses)
    UI-->>Warga: Tampilkan Saldo Terkini

    %% Alur Peminjaman
    Warga->>UI: Ajukan Pinjaman Darurat
    UI->>Contract: Rekam Pengajuan Pinjaman
    Kader->>UI: Review Pengajuan Warga
    UI->>Wallet: Request Sign (Persetujuan Admin)
    Wallet->>Contract: Validasi Auth Admin & Cairkan Dana
    Contract-->>UI: Dana masuk ke dompet Warga