# E2E Testing Plan - Warung Supplier Credit

Dokumen ini merancang testing end-to-end untuk memastikan tiga role utama, yaitu Warung, Supplier, dan Funder/Admin, saling terhubung sampai lifecycle invoice selesai. Fokusnya adalah validasi flow bisnis PRD, integrasi API, dan titik kritis Stellar/Soroban.

## 1. Tujuan Testing

- Membuktikan flow pembiayaan stok berjalan dari katalog sampai invoice lunas.
- Memastikan dana tidak dicairkan sebagai cash loan, tetapi terkait invoice barang.
- Memastikan transisi status invoice konsisten di UI, API, database, dan kontrak Soroban.
- Memastikan proses tanda tangan wallet dan transaksi Stellar berjalan sesuai role.
- Menemukan risiko bisnis: over-limit, dispute, pembayaran telat, dan mismatch data.

## 2. Scope Role

Untuk fase demo saat ini semua role bisa diakses dari satu akun, tetapi test case tetap dipisahkan berdasarkan tanggung jawab bisnis.

| Role | Area yang Diuji |
|---|---|
| Warung | Login/demo access, katalog, request stok, invoice, konfirmasi penerimaan, cicilan, reputasi |
| Supplier | Review request, approve/reject, katalog SKU, pengiriman barang, payout escrow |
| Funder/Admin | Funding escrow, portfolio, risiko komunitas, dispute, event blockchain, user management |

## 3. Environment

### Local Demo

- Web app: `http://127.0.0.1:5173`
- API: `http://localhost:8080/api`
- Mode akses: Freighter wallet atau Mode Demo all-role
- Data fallback: mock data web ketika API offline

### Stellar Testnet

- Wallet extension: Freighter
- Network: Testnet
- Contract: `warung_supplier_credit`
- Asset: token testnet yang dipakai contract, atau mock asset sesuai deploy script
- Explorer: Stellar Expert Testnet untuk cek transaction hash dan event

## 4. Data Awal yang Disarankan

Siapkan minimal data berikut agar flow bisa diuji berurutan:

| Data | Nilai Contoh |
|---|---|
| Warung | Warung Sari Jaya / Bu Sari |
| Supplier | SRC Makmur Jaya |
| Funder/Admin | Demo All Access atau wallet funder testnet |
| Produk | Beras, minyak, mie instan, gula |
| Limit awal warung | Rp1.000.000 sampai Rp25.000.000 |
| Request stok | Rp800.000 atau nilai kecil di bawah limit |
| Tenor | 4 atau 5 cicilan mingguan |

## 5. Happy Path E2E Utama

### TC-E2E-001 - Invoice Berhasil Sampai Lunas

Tujuan: membuktikan alur utama dari request stok sampai reputasi naik.

| Step | Role | Aksi | Expected Result |
|---|---|---|---|
| 1 | Warung | Masuk aplikasi via Mode Demo atau Freighter | Dashboard terbuka, limit dan reputasi terlihat |
| 2 | Warung | Buka katalog dan pilih beberapa SKU | Total pengajuan muncul di ringkasan |
| 3 | Warung | Submit request stok | Request dibuat, limit tersedia berkurang atau reserved |
| 4 | Supplier | Buka Permintaan Stok | Request warung muncul dengan nilai order dan skor reputasi |
| 5 | Supplier | Approve request | Invoice dibuat, status menjadi `Approved`, tx hash `create_invoice` tersimpan jika on-chain |
| 6 | Funder/Admin | Buka Escrow Locks | Invoice approved muncul dan siap funded |
| 7 | Funder/Admin | Fund ke escrow | Freighter meminta sign, status menjadi `Funded`, dana masuk contract |
| 8 | Supplier | Tandai barang dikirim | Status menjadi `Shipped`, tx hash/event pengiriman tercatat |
| 9 | Warung | Buka detail invoice dan konfirmasi barang diterima | Status menjadi `Repaying`, escrow release ke supplier |
| 10 | Warung | Bayar cicilan pertama | Outstanding berkurang, event payment tercatat |
| 11 | Warung | Bayar semua cicilan | Status menjadi `Paid`, outstanding `0`, reputasi naik |
| 12 | Funder/Admin | Cek portfolio dan logs | Repayment performance dan blockchain logs update |

Acceptance criteria:

- Tidak ada status yang lompat tidak sesuai lifecycle.
- Invoice tidak bisa funded sebelum supplier approve.
- Supplier tidak mendapat payout sebelum barang diterima atau dispute diselesaikan.
- Outstanding tidak boleh negatif.
- Reputasi naik untuk pembayaran tepat waktu.
- Semua transaksi Stellar yang memakai signer menghasilkan tx hash valid.

## 6. Negative dan Edge Case

### TC-E2E-002 - Request Melebihi Limit

- Role: Warung
- Aksi: pilih barang dengan total lebih besar dari available limit.
- Expected:
  - Submit ditolak atau user diminta mengurangi jumlah.
  - Tidak ada invoice on-chain dibuat.
  - Available limit tidak berubah permanen.

### TC-E2E-003 - Supplier Reject Request

- Role: Supplier
- Aksi: reject request stok.
- Expected:
  - Request menjadi `REJECTED`.
  - Reserved limit warung dikembalikan.
  - Tidak ada escrow/funding action tersedia.

### TC-E2E-004 - Supplier Minta Revisi

- Role: Supplier dan Warung
- Aksi: supplier revisi jumlah/harga, warung menyetujui.
- Expected:
  - Total invoice berubah sesuai revisi.
  - Warung melihat ulang jadwal cicilan sebelum menyetujui.
  - Invoice baru dibuat hanya setelah revisi disetujui.

Catatan: jika fitur revise belum ada di aplikasi, catat sebagai gap MVP.

### TC-E2E-005 - Funding Tanpa Saldo atau Signature Gagal

- Role: Funder/Admin
- Aksi: fund invoice dengan wallet tanpa saldo atau reject Freighter signature.
- Expected:
  - Status tetap `Approved`.
  - Tidak ada dana terkunci di contract.
  - UI menampilkan error yang jelas.

### TC-E2E-006 - Pengiriman Belum Dikonfirmasi

- Role: Supplier dan Warung
- Aksi: supplier mark shipped, warung belum confirm.
- Expected:
  - Status tetap `Shipped`.
  - Payout supplier belum completed.
  - Admin bisa melihat transaksi menunggu konfirmasi.

### TC-E2E-007 - Dispute Barang

- Role: Warung/Admin/Supplier
- Aksi: warung membuka dispute setelah shipped.
- Expected:
  - Status menjadi `Disputed`.
  - Payout supplier tertahan.
  - Admin bisa resolve dengan dua hasil:
    - release ke supplier, status lanjut `Repaying`;
    - refund ke funder, status `Cancelled`, reputasi turun bila warung/supplier terbukti bermasalah sesuai rule.

### TC-E2E-008 - Pembayaran Telat

- Role: Warung
- Aksi: bayar cicilan setelah due timestamp.
- Expected:
  - Repayment tercatat late.
  - Reputasi turun.
  - Admin watchlist risiko terupdate.
  - Limit tidak naik.

## 7. Matrix Status Lifecycle

Gunakan matrix ini untuk memastikan tombol hanya muncul pada status yang benar.

| Status | Aksi yang Boleh | Aksi yang Tidak Boleh |
|---|---|---|
| `Requested` | Supplier approve/reject | Fund, ship, confirm delivery, pay installment |
| `Approved` | Funder fund escrow | Ship, confirm delivery, pay installment |
| `Funded` | Supplier mark shipped | Pay installment, release payout manual tanpa shipped |
| `Shipped` | Warung confirm delivery, open dispute | Pay installment sebelum received |
| `Disputed` | Admin resolve dispute | Supplier payout otomatis |
| `Repaying` | Warung pay installment | Fund ulang, ship ulang |
| `Paid` | View history, update reputation/limit | Pay lagi, dispute baru |
| `Cancelled` | View history | Fund/pay/ship |
| `Defaulted` | Recovery/restructure | New request tanpa unfreeze |

## 8. Verifikasi API

Minimal endpoint yang perlu dicek per flow:

- `POST /auth/connect-wallet`
- `GET /warung/dashboard`
- `GET /products`
- `POST /credit-requests`
- `GET /supplier/requests`
- `POST /supplier/requests/:id/approve`
- `GET /admin/invoices`
- `POST /admin/invoices/:id/fund`
- `POST /invoices/:id/confirm-delivery`
- `POST /invoices/:id/pay-installment`
- `GET /admin/contract-events`

Checklist API:

- Response code sesuai: `200`, `201`, `400`, `401/403`, `404`.
- Header `X-Wallet-Address` dipakai konsisten.
- Error response punya pesan yang bisa ditampilkan UI.
- Id invoice database dan `contract_invoice_id` on-chain tidak tertukar.
- API tidak mengubah status lokal jika transaksi Soroban gagal.

## 9. Verifikasi Stellar/Soroban

### Hal yang Harus Diperhatikan

1. Network harus Testnet.
   Jika wallet di Mainnet atau network berbeda, transaksi harus ditolak sebelum signing.

2. Auth signer harus sesuai fungsi contract.
   - `create_invoice`: saat ini contract membutuhkan `admin.require_auth()`.
   - `approve_invoice`: supplier signer.
   - `fund_invoice`: funder signer.
   - `mark_shipped`: supplier signer.
   - `confirm_delivery`: warung signer.
   - `pay_installment`: warung/payer signer.
   - `resolve_dispute`: admin signer.

3. Token balance dan allowance/trustline harus siap.
   Funder harus punya saldo asset untuk escrow. Warung harus punya saldo asset untuk repayment. Jika memakai issued asset, pastikan trustline ada.

4. Decimal dan satuan token harus konsisten.
   Nominal rupiah di UI tidak boleh langsung diasumsikan sama dengan unit token. Perlu mapping jelas, misalnya `1 IDR demo = 1 unit token`, atau pakai stablecoin test asset.

5. Transaction XDR harus jelas lifecycle-nya.
   Untuk flow dengan Freighter:
   - API membuat unsigned XDR.
   - Frontend meminta tanda tangan.
   - API submit signed XDR.
   - Backend menyimpan tx hash dan status setelah success.

6. Contract storage perlu dicek.
   Setelah tiap transaksi, panggil getter atau lihat event untuk memastikan:
   - `Invoice.status`
   - `Invoice.outstanding`
   - `Invoice.funder`
   - `Reputation.score`

7. Event harus bisa diaudit.
   Contract saat ini emit event:
   - `inv_creat`
   - `inv_appr`
   - `inv_fund`
   - `inv_ship`
   - `inv_deliv`
   - `inv_rele`
   - `inv_pay`
   - `rep_upd`
   - `disp_ope`
   - `disp_res`

8. Finality dan retry.
   Jangan update UI sebagai final sebelum transaksi masuk ledger. Jika submit timeout, gunakan tx hash untuk cek status sebelum retry.

9. Prevent double-submit.
   Tombol fund, ship, confirm, dan pay harus disabled ketika transaksi pending agar tidak membuat request ganda.

10. Fee dan simulation.
   Sebelum signing, transaksi Soroban sebaiknya disimulasikan untuk resource fee, footprint, dan kemungkinan failure.

## 10. Test Contract Level

Tambahkan unit/integration test Soroban untuk kondisi berikut:

- `initialize` hanya bisa sekali.
- `create_invoice` gagal tanpa admin auth.
- `approve_invoice` hanya bisa dari `Requested`.
- `fund_invoice` hanya bisa dari `Approved` dan memindahkan token ke contract.
- `mark_shipped` hanya bisa dari `Funded`.
- `confirm_delivery` hanya bisa dari `Shipped` dan otomatis release ke supplier.
- `pay_installment` mengurangi outstanding dan status menjadi `Paid` ketika lunas.
- pembayaran setelah due timestamp menurunkan reputasi.
- `open_dispute` hanya dari `Shipped` atau `Delivered`.
- `resolve_dispute(false)` refund ke funder dan status `Cancelled`.

## 11. Test UI

### Smoke Test

- Login screen tampil.
- Mode Demo membuka semua tab role.
- Tab Warung, Supplier, Funder/Admin dapat dibuka tanpa reload.
- Toast success/error muncul.
- Layout tidak overflow di mobile/tablet.

### Flow Test

- Warung: tambah produk ke cart, total benar, submit request.
- Supplier: request muncul, detail skor reputasi terlihat, approve/reject bekerja.
- Admin: invoice muncul di escrow table, fund button hanya muncul untuk `Approved`.
- Warung: detail invoice menampilkan timeline, repayment schedule, blockchain info.

## 12. Test Database dan Konsistensi Data

Setelah setiap status penting, cek database:

- request stok dibuat dengan item dan subtotal benar.
- invoice dibuat dengan total, outstanding, tenor, due date.
- status lokal sama dengan status contract.
- repayment schedule dibuat setelah invoice masuk repayment.
- event contract tersimpan dengan tx hash, ledger, payload, timestamp.
- available limit warung kembali naik setelah pembayaran.

## 13. Urutan Testing yang Direkomendasikan

1. Unit test contract Soroban.
2. Unit/integration test service API tanpa Stellar live.
3. Local UI smoke test dengan mock/fallback data.
4. API + database test dengan seeded data.
5. Testnet dry run untuk `create_invoice`.
6. Testnet full happy path sampai cicilan pertama.
7. Testnet negative cases: reject signature, saldo kurang, wrong network.
8. E2E regression setelah ada perubahan UI/API/contract.

## 14. Exit Criteria

Testing dianggap selesai untuk MVP jika:

- Happy path berhasil minimal 3 kali berturut-turut.
- Minimal 1 dispute flow berhasil sampai resolved.
- Minimal 1 late repayment flow memengaruhi reputasi/risk.
- Semua tx hash penting bisa dibuka di explorer Testnet.
- Tidak ada mismatch status antara UI, database, dan contract.
- Tidak ada tombol aksi yang muncul pada status yang salah.
- Error wallet/network/saldo/signature bisa dipahami user.

## 15. Catatan Gap Saat Ini

- Mode all-role cocok untuk demo, tetapi role auth perlu dikembalikan sebelum production.
- Fitur revise request belum terlihat lengkap di UI, padahal masuk PRD.
- Delivery proof upload belum terlihat sebagai file/foto nyata.
- Dispute handling UI perlu dipastikan tersedia end-to-end.
- Mapping IDR ke asset/token Stellar perlu ditentukan eksplisit.
- Mock fallback berguna untuk demo, tetapi QA harus membedakan hasil mock dan hasil API live.
