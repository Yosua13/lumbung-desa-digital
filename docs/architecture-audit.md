# Warung Supplier Credit - Architecture Audit

Tanggal audit: 2026-07-08

## Ringkasan

Project saat ini adalah React/Vite single-page demo yang sudah kuat untuk pitch multi-role, tetapi belum menjadi arsitektur web3/fintech production-style. SRS meminta React web app, Go API/worker, PostgreSQL, double-entry ledger, Soroban escrow/event layer, Stellar RPC/Horizon, dan partner fiat/anchor. Karena repo saat ini belum memiliki backend/database, perubahan dilakukan sebagai fondasi bertahap: memisahkan domain logic, menambah adapter Stellar/Freighter, menyiapkan kontrak Soroban, script binding, dan runbook deployment testnet.

## Temuan Utama

1. State finansial masih berada di React local state.
   - Risiko: tidak ACID, tidak idempotent, tidak cocok untuk payout/repayment production.
   - Perubahan: ditambah modul domain `src/domain/*` untuk kalkulasi invoice, repayment, workflow, dan journal validation sebagai langkah awal sebelum dipindahkan ke Go service.

2. Stellar masih berupa hash simulasi.
   - Risiko: klaim settlement tidak bisa diverifikasi.
   - Perubahan: ditambah `src/config/stellar.ts`, `src/web3/*`, `src/hooks/useStellarWallet.ts`, dan `WalletConnectionBar` untuk koneksi Freighter Testnet dan metadata explorer.

3. Invoice lifecycle melompat dari supplier approval ke koperasi review/payout.
   - Risiko: tidak sesuai Appendix A SRS.
   - Perubahan: supplier approval sekarang menjadi `SUPPLIER_APPROVED`; receipt mengikuti `RECEIVED_CONFIRMED -> PAYOUT_PROCESSING -> REPAYMENT_ACTIVE`.

4. Koperasi dapat melihat/approve invoice yang belum disetujui supplier.
   - Risiko: dana pool bisa terkunci sebelum validasi supplier.
   - Perubahan: queue koperasi hanya `SUPPLIER_APPROVED`/`COOP_REVIEW`, dan approval funding memiliki guard status serta guard saldo pool.

5. Jadwal cicilan hardcoded.
   - Risiko: tenor pilihan warung tidak memengaruhi jadwal.
   - Perubahan: jadwal dibuat dari `createFlexibleRepaymentSchedules(invoiceId, totalDue, tenorDays)`.

6. Ledger belum double-entry secara formal.
   - Risiko: saldo UI bisa berubah tanpa journal balance.
   - Perubahan: ditambah validator journal draft dan contoh journal lock/repayment. Tahap produksi tetap perlu tabel `journal_entries` dan `journal_lines`.

7. Dependency boros/tidak relevan.
   - Risiko: bundle dan maintenance membesar.
   - Perubahan: dependency Gemini/Express/dotenv dihapus; `@stellar/stellar-sdk` dan `@stellar/freighter-api` ditambahkan.

8. Soroban belum ada.
   - Risiko: tidak ada source contract untuk event `FundLocked`, `InvoiceReleased`, `RepaymentPosted`.
   - Perubahan: ditambah kontrak `contracts/pool_escrow`, script setup Ubuntu, deploy testnet, dan generate TypeScript bindings.

## Target Arsitektur Berikutnya

1. Buat `apps/api` Go backend dengan clean architecture.
2. Pindahkan semua mutation finansial dari React ke API service transaction.
3. Tambahkan PostgreSQL migration untuk users, parties, invoices, pools, funding_allocations, payouts, withdrawals, ledger, audit, outbox, dan stellar logs.
4. Implement outbox worker untuk payout, repayment overdue scan, Stellar reconciliation, dan notification.
5. Integrasikan binding `packages/stellar-bindings/pool_escrow` ke adapter frontend/backend setelah kontrak dideploy.
6. Tambahkan test unit untuk invoice calculation, status transition, ledger balance, dan contract tests.
