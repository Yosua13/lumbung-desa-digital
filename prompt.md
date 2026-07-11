Anda bertindak sebagai gabungan:

- Senior Product Manager Fintech
- Senior Business Analyst
- Software Architect
- Technical Lead Golang
- Technical Lead ReactJS
- Blockchain Engineer Stellar/Soroban
- QA Lead
- DevOps/Platform Engineer
- Financial Operations Analyst

Tugas Anda adalah menganalisis repository Warung Supplier Credit dan membuat backlog issue implementasi yang profesional, terurut, tidak duplikat, dan dapat dikerjakan satu per satu.

==================================================
1. KONFIGURASI PEKERJAAN
==================================================

Nama project:
Warung Supplier Credit

Repository:
<ISI_URL_ATAU_PATH_REPOSITORY>

Default branch:
<ISI_BRANCH, CONTOH: main>

Issue platform:
<GitHub / GitLab / Jira>

Mode:
<PLAN_ONLY / CREATE_ISSUES>

AUTO_CREATE:
<false / true>

Tanggal mulai:
<YYYY-MM-DD>

Durasi sprint:
2 minggu

Kapasitas tim:
- Backend Golang: <jumlah orang>
- Frontend ReactJS: <jumlah orang>
- Stellar/Soroban: <jumlah orang>
- QA: <jumlah orang>
- UI/UX: <jumlah orang>
- DevOps: <jumlah orang>
- Product/Business: <jumlah orang>

Dokumen sumber utama:
- Warung_Supplier_Credit_Saran_Pengembangan_Berlangsung_ID.docx
- Warung_Supplier_Credit_SRS.docx
- Warung_Supplier_Credit_PRD.docx
- Dokumen konsep lain yang tersedia dalam repository

Tech stack awal:
- Backend: Golang
- Frontend: ReactJS/TypeScript
- Database: PostgreSQL
- Blockchain: Stellar dan Soroban
- Integrasi: Stellar RPC/Horizon dan payment/on-off-ramp partner
- Worker/background processing
- Double-entry ledger
- Audit trail
- Website responsive

Jangan mengubah stack atau arsitektur tanpa alasan kuat. Jika implementasi repository berbeda dari dokumen, gunakan repository sebagai kondisi aktual dan catat selisihnya.

==================================================
2. TUJUAN UTAMA
==================================================

Buat backlog issue untuk menyempurnakan Warung Supplier Credit menjadi sistem yang siap diuji dalam pilot tertutup.

Target operasional utama:

onboarding
→ verifikasi
→ katalog
→ pengajuan invoice
→ pembayaran DP
→ review supplier
→ review risiko koperasi
→ pendanaan dari pool
→ dana dikunci
→ pengiriman barang
→ penerimaan penuh/parsial/dispute
→ payout supplier
→ pembayaran cicilan
→ overdue dan collection
→ rekonsiliasi
→ reporting dan audit

Backlog harus mencakup:

1. Perubahan flow bisnis.
2. Backend Golang.
3. Frontend ReactJS.
4. Database dan migration.
5. Stellar/Soroban.
6. Integrasi payment partner.
7. Ledger dan accounting.
8. Security dan audit.
9. Operasional koperasi.
10. Testing dan QA.
11. Observability.
12. Dokumentasi dan runbook.
13. Persiapan pilot.

==================================================
3. PEMERIKSAAN WAJIB SEBELUM MEMBUAT ISSUE
==================================================

Sebelum membuat issue:

1. Baca seluruh dokumen sumber yang tersedia.
2. Periksa struktur repository.
3. Identifikasi fitur yang:
   - sudah selesai;
   - sudah ada tetapi belum lengkap;
   - belum ada;
   - tidak sesuai dokumen;
   - berpotensi menimbulkan risiko finansial.
4. Periksa issue yang sudah ada agar tidak membuat duplikat.
5. Periksa migration, database schema, API, frontend routes, worker, smart contract, dan test yang sudah tersedia.
6. Buat matriks kondisi aktual:

| Area | Kondisi Saat Ini | Gap | Risiko | Rekomendasi |
|------|-------------------|-----|--------|-------------|

7. Jangan menganggap fitur belum tersedia sebelum memeriksa source code.
8. Jangan menghapus atau mengganti implementasi yang sudah benar.
9. Jika menemukan keputusan bisnis yang belum jelas, buat issue bertipe `decision` sebelum issue implementasinya.

==================================================
4. PRINSIP BISNIS YANG TIDAK BOLEH DILANGGAR
==================================================

1. Semua nilai bisnis ditampilkan dalam Rupiah.
2. Warung tidak menerima dana pembiayaan secara tunai.
3. Dana diarahkan ke invoice supplier.
4. Investor berpartisipasi melalui pool koperasi.
5. Supplier menerima Rupiah melalui auto-cashout.
6. Stellar/Soroban digunakan di belakang layar untuk escrow, event, treasury control, dan auditability.
7. Pengguna umum tidak diwajibkan memahami XLM, wallet address, private key, atau blockchain.
8. Transaksi finansial harus idempotent.
9. Semua perubahan saldo harus menggunakan double-entry ledger.
10. Journal yang sudah posted tidak boleh diedit; koreksi menggunakan reversal.
11. Operasi sensitif harus memiliki maker-checker atau dual approval.
12. Semua aksi penting memiliki audit trail.
13. Data invoice lama tidak boleh berubah akibat perubahan katalog.
14. Parameter bisnis harus configurable, bukan hard-coded.

Parameter configurable minimal:

- minimum DP;
- maksimal tenor;
- grace period;
- admin fee warung;
- supplier success fee;
- withdrawal fee;
- payout cutoff;
- quote-lock TTL;
- volatility buffer;
- dispute SLA;
- exposure limit;
- approval threshold;
- collection threshold;
- restructuring rule;
- cash-on-hand limit.

==================================================
5. AREA BACKLOG YANG WAJIB DIBUAT
==================================================

Buat epic dan issue minimal untuk area berikut.

EPIC 01 — Product Rules dan Configuration

- Konfigurasi DP, tenor, fee, grace period, quote TTL, buffer, dan SLA.
- Approval matrix.
- Exposure cap per warung, supplier, koperasi, dan pool.
- Aturan pembatalan invoice.
- Aturan refund DP.
- Aturan partial funding.
- Aturan loss allocation.
- Return calculation investor.
- Withdrawal window.
- Pool liquidity policy.
- Decision record untuk aturan yang belum disepakati.

EPIC 02 — Role, RBAC, dan Segregation of Duties

Role minimal:

- Warung
- Supplier
- Investor
- Petugas onboarding
- Risk Officer koperasi
- Kasir/Teller koperasi
- Collection Officer
- Finance/Reconciliation Officer
- Treasury/Pool Manager
- Admin Dispute
- Platform Admin
- Checker/Supervisor

Buat issue untuk:

- permission matrix;
- maker-checker;
- dual approval;
- limit authority;
- audit access;
- larangan satu user menyetujui, mencairkan, dan merekonsiliasi transaksi yang sama.

EPIC 03 — Onboarding, KYC/KYB, dan Aktivasi Berjenjang

- OTP dan profil dasar.
- Upload identitas dan dokumen usaha.
- Status NEED_REVISION, REJECTED, LIMITED_APPROVAL, ACTIVE.
- Aktivasi terbatas dengan limit awal kecil.
- Pembuatan party profile.
- Pembuatan ledger account.
- Mapping wallet/contract account.
- Initial risk tier.
- Audit verifikasi.
- Re-verification dan suspension.

EPIC 04 — Katalog, Order, Invoice, dan DP

- Histori harga.
- Snapshot barang dan harga pada invoice.
- MOQ, stock, lead time, area layanan.
- Invoice versioning.
- Supplier approve/reject/request revision.
- Pengajuan DP dan tenor.
- DP melalui transfer/VA.
- DP melalui QRIS.
- DP tunai melalui koperasi.
- Refund DP.
- Pembatalan invoice.
- Revisi invoice setelah persetujuan.
- Validasi DP settled sebelum funding lock.

EPIC 05 — Risk Review dan Pool Funding

- Available limit dan active exposure.
- Risk summary warung.
- Histori repayment.
- Supplier concentration.
- Tenor dan DP recommendation.
- Approve sesuai pengajuan.
- Approve dengan perubahan.
- Pending field verification.
- Reject dengan reason code.
- Pool available-to-locked movement.
- Funding allocation snapshot.
- Partial funding jika kebijakan mengizinkan.
- Insufficient pool balance.
- Concurrent funding protection.
- Ledger posting funding.
- Soroban FundLocked event.

EPIC 06 — Supplier Fulfillment dan Penerimaan Barang

- Delivery note.
- Bukti pengiriman.
- Tracking/resi.
- SLA pengiriman.
- Full delivery.
- Partial delivery.
- Short delivery.
- Product substitution.
- Barang rusak.
- Barang mendekati kedaluwarsa.
- Reshipment.
- Retur barang.
- Penerimaan per item.
- Acceptance evidence.
- Holdback amount.
- Invoice amendment.
- Supplier performance metrics.

EPIC 07 — Dispute dan Resolusi

- Membuka dispute.
- Evidence dari warung.
- Evidence dari supplier.
- SLA respons awal.
- Escalation clock.
- Hold payout saat dispute.
- Full release.
- Partial release.
- Refund.
- Reshipment.
- Invoice amendment.
- Cancellation.
- Maker-checker untuk dispute bernilai besar.
- Decision template.
- Reason code.
- Audit resolusi.
- Notifikasi semua pihak.

EPIC 08 — Payout Supplier dan Auto-Cashout Rupiah

- Payout request.
- Rate lock dan quote storage.
- Quote expiry.
- Gross amount.
- Supplier fee.
- Buffer.
- Net amount.
- Partner reference.
- Payout lifecycle:
  PENDING
  PROCESSING
  SUCCESS
  FAILED
  REVERSED
- Cutoff dan settlement batch.
- Retry policy.
- Partner timeout.
- Reversal.
- Duplicate payout protection.
- Supplier receipt.
- Dashboard payout.
- Reconciliation payout.
- Event Stellar/Soroban release.
- Manual override dengan dual approval.

EPIC 09 — Pembayaran Cicilan Multikanal

Kanal wajib:

A. Transfer bank / virtual account
- Payment reference unik.
- Webhook settled.
- Validasi nominal dan referensi.
- Receipt digital.

B. QRIS / e-wallet
- Dynamic QR/payment link.
- Webhook.
- Pending verification jika callback terlambat.
- Channel fee terpisah.

C. Tunai ke koperasi
- Kasir mencari invoice/kode pembayaran.
- Cash receipt unik.
- Cash-on-hand ledger.
- Cash count.
- Supervisor closing.
- Setoran bank.
- Settlement.
- Cash variance.
- Suspense account.

D. Pembayaran parsial
- PARTIAL status.
- Allocation ke cicilan tertua.
- Kebijakan alokasi configurable.

E. Kelebihan pembayaran
- Alokasi ke cicilan berikutnya.
- Refundable credit.
- Refund sesuai approval.

F. Pembayaran tanpa referensi
- Masuk suspense account.
- Manual matching dengan maker-checker.

EPIC 10 — Payment Allocation Engine

- Allocation berdasarkan invoice.
- Allocation berdasarkan schedule.
- Oldest-due-first.
- Pokok, fee, dan denda jika berlaku.
- Partial allocation.
- Overpayment.
- Unidentified payment.
- Reversal.
- Idempotency.
- Update outstanding.
- Update repayment schedule.
- Update trust score.
- Generate receipt.
- Posting ledger.

EPIC 11 — Overdue, Collection, dan Restrukturisasi

Tahapan minimal:

- Reminder H-3.
- Reminder H-1.
- Soft overdue H+1 sampai H+3.
- Grace period.
- Promise-to-pay.
- Collection case.
- Assignment collection officer.
- Field visit.
- Evidence kunjungan.
- Freeze limit.
- Restrukturisasi.
- Versioned repayment schedule.
- Approval restrukturisasi.
- Default classification.
- Recovery tracking.
- Collection dashboard.
- Aging dan DPD 1/7/30.
- Cure rate.

Pastikan restrukturisasi tidak menghapus histori keterlambatan.

EPIC 12 — Ledger dan Financial Accounting

- Chart of accounts.
- Investor liability.
- Pool contribution.
- Settlement asset.
- Cash on hand.
- Locked pool asset.
- Supplier payable.
- Invoice receivable.
- Platform revenue.
- Suspense account.
- Settlement in transit.
- Fee posting.
- Withdrawal posting.
- Reversal journal.
- Daily close.
- Balance validation.
- Immutable posted journal.
- Journal reference dan idempotency.
- Audit columns:
  d_rekam
  i_rekam
  d_ubah
  i_ubah
  d_hapus
  i_hapus
  row_version

EPIC 13 — Rekonsiliasi Tiga Arah

Bandingkan:

1. Internal ledger.
2. Payment/bank/on-off-ramp partner.
3. Stellar/Soroban event.

Buat issue untuk:

- reconciliation run;
- reconciliation items;
- matched/unmatched status;
- tolerance;
- duplicate event;
- missing webhook;
- missing Stellar event;
- partner amount mismatch;
- aged break;
- exception owner;
- SLA penyelesaian;
- webhook replay;
- manual match dengan maker-checker;
- reconciliation dashboard;
- daily reconciliation report.

EPIC 14 — Stellar dan Soroban Reliability

- FundLocked.
- Escrow release.
- Repayment event.
- Contract authorization.
- Transaction idempotency.
- Event indexing.
- Historical event storage.
- RPC retry.
- Sequence handling.
- Failed transaction recovery.
- Database-blockchain consistency.
- Reconciliation worker.
- Contract upgrade governance.
- Treasury spend cap.
- Allow list.
- Timelock.
- Dual approval.
- Testnet test suite.
- Mainnet readiness checklist.

EPIC 15 — Investor dan Pool Reporting

- Contribution statement.
- Allocation snapshot.
- Available, locked, and idle balance.
- Return calculation.
- Pool cashflow.
- Pool P&L.
- Liquidity coverage.
- Withdrawal notice.
- Withdrawal window.
- Loss waterfall.
- Fee disclosure.
- Periodic statement.
- Downloadable report.
- Investor withdrawal.
- Withdrawal flat fee.
- Reconciliation withdrawal.

EPIC 16 — Admin dan Operational Dashboard

- Verification queue.
- Funding approval queue.
- Dispute queue.
- Payout failure queue.
- Webhook failure queue.
- Reconciliation break queue.
- Collection cases.
- Cash variance.
- Withdrawal review.
- Manual override.
- Audit timeline.
- SLA timer.
- Assignment owner.
- Filters, export, dan saved view.
- Dashboard KPI.
- Role-based visibility.

EPIC 17 — Frontend UX dan Animasi

Warung:
- Pembayaran mudah dipahami.
- Instruksi transfer/QRIS/tunai.
- Receipt.
- Sisa tagihan.
- Jatuh tempo.
- Progress pembayaran.
- Permintaan restrukturisasi.

Supplier:
- Order.
- Dana aman.
- Delivery.
- Partial acceptance.
- Dispute.
- Payout status.

Koperasi:
- Risk review.
- Pool position.
- Cash teller.
- Collection.
- Reconciliation.

Investor:
- Pool performance.
- Statement.
- Withdrawal.

Animasi:
- invoice review;
- dana dikunci;
- barang dikirim;
- barang diterima;
- dana dilepas;
- Rupiah diterima;
- pembayaran berhasil;
- cicilan lunas.

Animasi wajib memiliki reduced-motion fallback dan tidak boleh menggantikan status tekstual.

EPIC 18 — Notification dan Communication

- In-app.
- WhatsApp.
- SMS.
- Email.
- Reminder pembayaran.
- Payout status.
- Dispute update.
- Collection notification.
- Withdrawal update.
- Template versioning.
- Delivery status.
- Retry.
- Opt-in/consent.
- Notification audit.

EPIC 19 — Observability, Security, dan Reliability

- Structured logging.
- Correlation ID.
- Invoice ID.
- Payment ID.
- Payout ID.
- Stellar transaction hash.
- Metrics.
- Tracing.
- Alerting.
- Failed webhook alert.
- Payout stuck alert.
- Reconciliation break alert.
- Ledger imbalance alert.
- Secret management.
- KMS/Vault.
- PII masking.
- Rate limiting.
- File upload validation.
- Session security.
- Backup.
- Restore test.
- Disaster recovery runbook.

EPIC 20 — Pilot Readiness

- SOP onboarding.
- SOP cash teller.
- SOP daily closing.
- SOP payout failed.
- SOP dispute.
- SOP collection.
- SOP reconciliation.
- SOP manual override.
- Training koperasi.
- Training supplier.
- Training warung.
- UAT.
- Pilot data seeding.
- Exposure cap.
- Go-live checklist.
- Incident response.
- Rollback plan.
- Pilot KPI dashboard.
- Legal/compliance decision log.

==================================================
6. PERLUASAN DATA MODEL WAJIB DIPERTIMBANGKAN
==================================================

Periksa kebutuhan tabel/objek berikut dan buat issue jika belum tersedia:

- business_configurations
- approval_matrices
- invoice_versions
- invoice_receipts
- receipt_items
- delivery_notes
- delivery_items
- dispute_cases
- dispute_evidences
- dispute_decisions
- rate_locks
- conversion_quotes
- payout_attempts
- settlement_batches
- cash_receipts
- cash_closings
- cash_closing_items
- bank_deposits
- payment_instructions
- payment_events
- payment_allocations
- unidentified_payments
- suspense_items
- collection_cases
- collection_actions
- promise_to_pay
- restructuring_requests
- repayment_schedule_versions
- reconciliation_runs
- reconciliation_items
- allocation_snapshots
- webhook_events
- webhook_processing_attempts
- operational_tasks
- maker_checker_approvals
- manual_overrides
- investor_statements
- pool_daily_positions

Untuk setiap perubahan database:

- tentukan primary key dan foreign key;
- gunakan tipe numeric yang benar untuk uang;
- sertakan audit columns;
- sertakan status;
- sertakan row_version untuk optimistic locking jika dibutuhkan;
- buat index;
- buat unique constraint;
- buat check constraint;
- rancang migration forward dan rollback;
- hindari penghapusan data finansial;
- gunakan reversal atau status inactive untuk data finansial.

==================================================
7. TIMELINE DAN MILESTONE
==================================================

Gunakan milestone berikut sebagai baseline. Sesuaikan berdasarkan kondisi repository dan kapasitas tim.

MILESTONE 0 — Discovery dan Decision Closure
Minggu 1

Output:
- repository audit;
- gap matrix;
- status machine review;
- business decision issues;
- architecture decision record;
- backlog final;
- dependency map.

MILESTONE 1 — MVP Hardening
Minggu 2–8

Prioritas:
- configuration engine;
- DP dan invoice lifecycle;
- partial receipt;
- dispute holdback;
- payout lifecycle;
- rate lock;
- webhook idempotency;
- transfer/VA repayment;
- QRIS repayment;
- cash repayment;
- payment allocation;
- basic reconciliation;
- collection case dasar.

MILESTONE 2 — Pilot Operations v2
Minggu 9–14

Prioritas:
- collection ladder;
- promise-to-pay;
- restructuring;
- cash closing;
- settlement batches;
- partner cutoff;
- aging report;
- supplier performance;
- advanced dispute;
- operational queues;
- three-way reconciliation;
- SOP dan training.

MILESTONE 3 — Pilot Readiness
Minggu 15–16

Prioritas:
- UAT;
- regression test;
- security test;
- load test;
- reconciliation simulation;
- failure scenario drill;
- data migration rehearsal;
- pilot configuration;
- monitoring;
- runbook;
- go-live checklist;
- rollback checklist.

MILESTONE 4 — Controlled Scale
Pasca-pilot, estimasi 8–12 minggu

Prioritas:
- treasury contract account;
- automated risk rules;
- investor statement;
- pool P&L;
- self-service supplier onboarding;
- performance optimization;
- stronger fraud monitoring.

Gunakan sprint 2 minggu.

Untuk setiap issue, tetapkan:

- milestone;
- sprint;
- target week;
- dependency;
- blocking issue;
- owner role;
- estimate.

Jika timeline tidak realistis berdasarkan kapasitas tim, buat rekomendasi timeline baru dan jelaskan alasannya.

==================================================
8. FORMAT EPIC
==================================================

Gunakan format berikut:

# [EPIC][AREA] Nama Epic

## Tujuan
Jelaskan hasil bisnis yang ingin dicapai.

## Masalah Saat Ini
Jelaskan gap dari kondisi repository/dokumen.

## Outcome
Jelaskan kondisi setelah epic selesai.

## Scope
- ...

## Di Luar Scope
- ...

## Dependency
- ...

## Risiko
- ...

## Success Metrics
- ...

## Daftar Issue
1. ...
2. ...

## Definition of Done Epic
- [ ] Semua issue P0/P1 selesai.
- [ ] End-to-end flow berhasil.
- [ ] Tidak ada critical defect.
- [ ] Financial reconciliation lulus.
- [ ] Dokumentasi dan runbook tersedia.
- [ ] Product Owner dan QA memberikan approval.

==================================================
9. FORMAT WAJIB SETIAP ISSUE
==================================================

Gunakan template ini untuk setiap issue.

# [AREA][P0/P1/P2/P3] Judul Issue yang Spesifik

## Metadata

- Type:
  feature / bug / technical-debt / operation / compliance / decision / research
- Epic:
- Milestone:
- Sprint:
- Target week:
- Priority:
- Actor:
- Owner role:
- Estimate:
- Dependencies:
- Blocking:
- Labels:

## Latar Belakang

Jelaskan kondisi saat ini dan mengapa issue ini dibutuhkan.

## Permasalahan

Jelaskan masalah bisnis, operasional, atau teknis yang harus diselesaikan.

## User Story

Sebagai <aktor>,
saya ingin <tujuan>,
sehingga <manfaat>.

## Tujuan

Jelaskan hasil terukur dari issue ini.

## Scope

- ...
- ...

## Di Luar Scope

- ...
- ...

## Flow Bisnis

Tuliskan flow normal langkah demi langkah.

1. ...
2. ...

## Exception Flow

Tuliskan minimal:

- data tidak valid;
- duplicate request;
- retry;
- timeout;
- insufficient balance;
- status tidak sesuai;
- webhook terlambat;
- partner gagal;
- transaksi parsial;
- reversal;
- unauthorized action.

Hanya masukkan exception yang relevan.

## Status Transition

Tuliskan:

CURRENT_STATUS
→ ACTION
→ NEW_STATUS

Sebutkan transition yang tidak diperbolehkan.

## Business Rules

- ...
- ...

## Backend Golang

Jelaskan:

- module/domain;
- use case;
- handler;
- DTO;
- service;
- repository;
- worker;
- transaction boundary;
- idempotency;
- error handling.

Jangan menulis implementasi code lengkap di issue.

## Frontend ReactJS

Jelaskan:

- halaman;
- komponen;
- form;
- validasi;
- loading state;
- empty state;
- error state;
- permission;
- responsive behavior;
- animation/reduced motion.

## Database

Jelaskan:

- tabel baru/perubahan;
- kolom;
- relasi;
- index;
- constraint;
- audit columns;
- migration;
- rollback;
- data backfill jika ada.

## Stellar/Soroban

Jika relevan, jelaskan:

- contract method;
- authorization;
- event;
- transaction hash;
- retry;
- reconciliation;
- state consistency.

Jika tidak relevan, tulis:
Tidak ada perubahan Stellar/Soroban.

## Integrasi Eksternal

Jika relevan:

- endpoint partner;
- request/response;
- webhook;
- signature verification;
- timeout;
- retry;
- idempotency;
- reconciliation.

## Dampak Ledger dan Akuntansi

Tuliskan posting debit/kredit jika issue memengaruhi dana.

Contoh:

Event:
Pembayaran cicilan tunai diterima

Debit:
Cash on Hand Koperasi

Credit:
Invoice Receivable

Jika tidak ada dampak ledger, tulis:
Tidak ada dampak ledger.

## Security dan Audit

- RBAC;
- maker-checker;
- PII masking;
- audit trail;
- before/after;
- actor;
- timestamp;
- IP/user agent jika relevan.

## Acceptance Criteria

Gunakan Given/When/Then.

### Scenario 1 — Happy Path

Given ...
When ...
Then ...

### Scenario 2 — Exception

Given ...
When ...
Then ...

### Scenario 3 — Idempotency atau Retry

Given ...
When ...
Then ...

Tambahkan scenario lain jika diperlukan.

## Test Plan

- Unit test
- Repository/integration test
- API test
- Frontend component test
- E2E test
- Contract test
- Negative test
- Security test
- Reconciliation test

Pilih yang relevan.

## Observability

- log;
- metric;
- trace;
- alert;
- dashboard.

## Dokumentasi

- OpenAPI;
- README;
- ADR;
- SOP;
- runbook;
- user guide.

## Rollout dan Rollback

- feature flag;
- migration order;
- backward compatibility;
- rollback procedure;
- monitoring after release.

## Definition of Done

Gunakan checklist yang dapat diisi:

- [ ] Flow bisnis sudah disetujui Product Owner.
- [ ] Business rules sudah terdokumentasi.
- [ ] Acceptance criteria terpenuhi.
- [ ] Backend selesai dan code review approved.
- [ ] Frontend selesai dan responsive.
- [ ] Migration database selesai.
- [ ] Migration rollback tersedia atau strategi rollback dijelaskan.
- [ ] Audit columns tersedia.
- [ ] RBAC dan maker-checker diuji.
- [ ] Idempotency diuji untuk transaksi finansial.
- [ ] Double-entry journal balance.
- [ ] Unit test lulus.
- [ ] Integration test lulus.
- [ ] End-to-end test lulus.
- [ ] Negative dan exception test lulus.
- [ ] Tidak ada critical/high security issue.
- [ ] Logging, metric, dan alert tersedia.
- [ ] Dokumentasi API diperbarui.
- [ ] SOP/runbook diperbarui.
- [ ] QA memberikan approval.
- [ ] Product Owner melakukan UAT.
- [ ] CI/CD berhasil.
- [ ] Bukti berupa screenshot, test result, atau transaction reference dilampirkan.
- [ ] Tidak ada regression pada flow existing.
- [ ] Feature flag dan rollback plan tersedia jika diperlukan.
- [ ] Issue dependency sudah selesai.
- [ ] Issue siap dipindahkan ke status Done.

Hapus checklist yang benar-benar tidak relevan atau tandai:

- [x] N/A — alasan: ...

## Evidence of Completion

Issue belum boleh ditutup sebelum memiliki minimal salah satu:

- link pull request;
- screenshot UI;
- output automated test;
- migration result;
- API response;
- transaction hash Testnet;
- reconciliation report;
- QA evidence;
- UAT approval.

==================================================
10. GLOBAL DEFINITION OF DONE
==================================================

Sebuah issue hanya dianggap selesai apabila:

1. Implementasi sudah merge ke branch yang ditentukan.
2. Acceptance criteria terpenuhi.
3. Automated test lulus.
4. Manual QA/UAT selesai jika dibutuhkan.
5. CI/CD hijau.
6. Tidak ada critical defect.
7. Semua perubahan finansial memiliki audit trail.
8. Semua posting ledger balance.
9. Retry tidak menghasilkan transaksi ganda.
10. Status transition valid.
11. Dokumentasi diperbarui.
12. Monitoring tersedia.
13. Rollback jelas.
14. Bukti penyelesaian dilampirkan.
15. Issue yang menjadi dependency sudah selesai.
16. Product Owner atau pihak berwenang memberikan acceptance.

==================================================
11. ATURAN PEMECAHAN ISSUE
==================================================

1. Satu issue idealnya dapat diselesaikan dalam 1–5 hari kerja engineering.
2. Jika estimasi lebih dari 5 hari, pecah menjadi beberapa issue.
3. Jangan membuat issue terlalu umum seperti:
   “Implementasikan payment system”.
4. Pecah menjadi issue seperti:
   - Buat payment instruction transfer/VA.
   - Implementasi webhook settled.
   - Implementasi payment allocation.
   - Buat digital receipt.
   - Tambahkan reconciliation payment.
5. Pisahkan frontend, backend, contract, migration, dan ops apabila dapat dikerjakan paralel.
6. Jangan memisahkan terlalu kecil jika hasilnya tidak dapat diuji secara mandiri.
7. Setiap issue harus menghasilkan output yang dapat diverifikasi.
8. Issue policy/decision harus dibuat sebelum issue engineering yang bergantung padanya.
9. Hindari duplikasi issue.
10. Tautkan issue yang berhubungan dengan:
    depends on
    blocks
    relates to
    child of epic

==================================================
12. PRIORITY RULES
==================================================

P0 — Blocking dan Financial Integrity

- risiko kehilangan dana;
- double payout;
- double payment;
- ledger tidak balance;
- unauthorized transaction;
- broken state transition;
- reconciliation tidak dapat dilakukan;
- pilot tidak dapat berjalan.

P1 — Wajib untuk Pilot

- happy path;
- exception utama;
- repayment;
- cash collection;
- dispute;
- payout;
- reconciliation;
- collection;
- audit;
- dashboard operasional.

P2 — Penting Setelah Pilot Dasar

- automation;
- reporting lanjutan;
- performance optimization;
- UX enhancement;
- self-service.

P3 — Improvement

- kosmetik;
- analytics tambahan;
- nice-to-have;
- controlled-scale feature.

==================================================
13. LABEL YANG DIGUNAKAN
==================================================

Gunakan labels:

Type:
- type:feature
- type:bug
- type:tech-debt
- type:ops
- type:decision
- type:compliance
- type:research

Priority:
- priority:P0
- priority:P1
- priority:P2
- priority:P3

Area:
- area:onboarding
- area:invoice
- area:catalog
- area:funding
- area:pool
- area:repayment
- area:cash
- area:payout
- area:dispute
- area:collection
- area:ledger
- area:reconciliation
- area:stellar
- area:frontend
- area:backend
- area:database
- area:security
- area:devops
- area:reporting

Actor:
- actor:warung
- actor:supplier
- actor:koperasi
- actor:investor
- actor:admin
- actor:partner

Phase:
- phase:discovery
- phase:mvp-hardening
- phase:pilot-ops-v2
- phase:pilot-readiness
- phase:controlled-scale

==================================================
14. OUTPUT YANG WAJIB DIHASILKAN
==================================================

Urutan output:

A. Executive Summary

Berikan ringkasan:

- kondisi repository;
- gap terbesar;
- risiko terbesar;
- rekomendasi urutan pengerjaan;
- estimasi jumlah epic dan issue.

B. Repository Gap Matrix

| Module | Existing | Partial | Missing | Recommended Action |
|--------|----------|---------|---------|--------------------|

C. Timeline

| Milestone | Sprint | Minggu | Epic | Output | Dependency |
|-----------|--------|--------|------|--------|------------|

D. Epic List

| Epic | Tujuan | Priority | Milestone | Jumlah Issue |
|------|--------|----------|-----------|--------------|

E. Issue Backlog

Tampilkan setiap issue menggunakan template lengkap.

F. Dependency Graph

Gunakan format Mermaid:

graph TD
    ISSUE_A --> ISSUE_B

G. Critical Path

Jelaskan issue yang menghambat pilot jika terlambat.

H. Pilot Readiness Checklist

- [ ] State machine disetujui.
- [ ] Payment channel diuji.
- [ ] Cash closing diuji.
- [ ] Payout retry diuji.
- [ ] Partial receipt diuji.
- [ ] Dispute diuji.
- [ ] Collection diuji.
- [ ] Reconciliation diuji.
- [ ] Ledger balance diuji.
- [ ] Maker-checker diuji.
- [ ] Audit log diuji.
- [ ] Monitoring aktif.
- [ ] SOP tersedia.
- [ ] UAT selesai.
- [ ] Rollback drill selesai.

I. Issue Creation Result

Jika MODE=CREATE_ISSUES dan AUTO_CREATE=true:

- buat milestone;
- buat labels jika belum tersedia;
- buat epic;
- buat issue;
- tautkan dependency;
- hindari duplikasi;
- kembalikan tabel:

| Issue Number | Title | Epic | Milestone | Link |
|--------------|-------|------|-----------|------|

Jika tidak memiliki akses tulis, hasilkan seluruh issue dalam Markdown yang siap ditempel ke GitHub/GitLab/Jira.

==================================================
15. LARANGAN
==================================================

Jangan:

1. Membuat issue tanpa memeriksa repository.
2. Membuat issue duplikat.
3. Mengarang fitur yang bertentangan dengan dokumen.
4. Menyimpan nilai uang menggunakan float.
5. Mengedit journal finansial yang sudah posted.
6. Mengabaikan idempotency.
7. Mengabaikan exception flow.
8. Mengandalkan screenshot transfer sebagai bukti settlement final.
9. Menganggap input pembayaran tunai kasir otomatis sama dengan settlement bank.
10. Melepas payout ketika dispute masih aktif.
11. Menaruh private key atau secret di database biasa.
12. Menggabungkan dana user dan revenue platform.
13. Menggunakan XLM sebagai nilai utang warung.
14. Membuat keputusan legal tanpa catatan bahwa validasi compliance diperlukan.
15. Menutup issue tanpa evidence dan checklist DoD.

==================================================
16. INSTRUKSI TERAKHIR
==================================================

Mulai dengan:

1. Audit repository.
2. Baca dokumen.
3. Tampilkan gap matrix.
4. Buat timeline.
5. Buat epic.
6. Pecah epic menjadi issue atomik.
7. Tetapkan dependency.
8. Tetapkan Definition of Done.
9. Periksa duplikasi.
10. Jika AUTO_CREATE=true, buat issue ke platform.

Gunakan bahasa Indonesia untuk deskripsi issue.

Nama teknis, endpoint, table, status code, dan identifier tetap menggunakan bahasa Inggris yang konsisten.

Jangan langsung menulis kode implementasi.

Fokus Anda adalah menghasilkan backlog issue yang jelas, dapat diprioritaskan, dapat diperkirakan, dapat diuji, dan dapat ditutup menggunakan checklist Definition of Done.