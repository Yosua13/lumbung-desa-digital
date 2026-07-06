# Lumbung Desa Digital - Warung Supplier Credit

An invoice-based supplier financing platform for small warungs built on the **Stellar Testnet** using **Soroban smart contracts**, a **Golang REST API**, and a **React + TypeScript frontend**.

---

## 📖 Tentang Aplikasi (About the Application)

**Lumbung Desa Digital** adalah sebuah platform pembiayaan rantai pasok (*supply chain financing*) berbasis *invoice* yang dirancang khusus untuk membantu warung-warung kecil (UMKM) dalam mengelola permodalan dan pengadaan stok barang. 

Aplikasi ini menjembatani tiga pihak utama:
- **Warung (Pengecer)**: Dapat mengajukan kredit untuk membeli stok barang dari supplier tanpa harus membayar penuh di muka. Limit plafon ditentukan oleh skor reputasi mereka.
- **Supplier (Pemasok)**: Menerima pesanan, menyetujui, dan mengirimkan barang.
- **Funder (Pendana)**: Mengunci dana ke dalam *escrow* (*smart contract*) untuk mendanai transaksi tersebut sehingga aman bagi semua pihak.

**Fitur Utama:**
- 🛒 **Pengajuan Kredit Stok**: Warung dapat memesan barang dari supplier dengan sistem pembayaran tempo.
- 🔗 **Blockchain Escrow**: Dana transaksi dikunci menggunakan *smart contract* Soroban di jaringan **Stellar Testnet** sehingga transparan dan aman.
- 📈 **Sistem Reputasi**: Warung memiliki skor kredit (Reputation Score) yang akan meningkat setiap kali mereka melunasi cicilan tepat waktu. Semakin tinggi skor, semakin besar plafon kredit yang didapatkan.
- 💳 **Pembayaran Fleksibel**: Warung dapat membayar tagihan (*invoice*) secara cicilan setelah barang diterima, dan dana otomatis dicairkan ke pihak terkait secara *on-chain*.

Aplikasi ini mendemonstrasikan integrasi *off-chain* (PostgreSQL + Golang) untuk kelancaran *user experience* dan *on-chain* (Stellar/Soroban) untuk keamanan dana serta pencatatan riwayat transaksi secara terdesentralisasi.

---

## 📁 Project Structure
```text
lumbung-desa-digital/
│
├── apps/
│   ├── web/                         # Frontend React + Vite + TS (Teal Fintech UI)
│   └── api/                         # Backend Golang Clean REST API
│
├── contracts/
│   └── warung_supplier_credit/       # Soroban Smart Contract in Rust
│
├── packages/
│   ├── shared-types/                 # Shared TypeScript interface definitions
│   └── contract-bindings/            # Generated typescript contract bindings
│
├── docs/
│   ├── architecture.md               # Visual flow and technical layout
│   ├── api-spec.md                   # REST API routes and endpoints schema
│   ├── smart-contract-spec.md        # On-chain structs and functions specs
│   └── demo-flow.md                  # Step-by-step hackathon script
│
├── scripts/
│   ├── build-contract.ps1            # PowerShell contract compiler
│   ├── deploy-testnet.ps1            # PowerShell contract deployer
│   ├── seed-demo-data.ps1            # Local DB seeding description
│   └── simulate-flow.ps1             # E2E PowerShell automation simulation
│
├── .env.example                      # Environment variables configurations
├── README.md                         # This setup guide
└── Makefile                          # Development shortcuts manager
```

---

## 🛠️ Requirements & Setup

Ensure the following tools are installed on your local development machine:
1. **Go** (version 1.20+)
2. **Node.js** (version 18+ & npm)
3. **Rust** & Cargo (with `wasm32-unknown-unknown` target configured)
4. **PostgreSQL** running locally
5. **Stellar CLI** (optional, for direct deployment from system)

### 1. Database Setup
Create a local database named `lumbung_desa`:
```sql
CREATE DATABASE lumbung_desa;
```
Configure your credentials in the `.env` file (copied from `.env.example` in the root):
```bash
cp .env.example .env
```
Update the `DATABASE_URL` in the `.env` file:
```text
DATABASE_URL=postgres://your_user:your_password@localhost:5432/lumbung_desa?sslmode=disable
```

---

## 🚀 Running the Project

You can manage the execution of all components using the `Makefile` shortcuts.

### Compile Smart Contract
```bash
make build
```
*Compiles the Rust smart contract into WebAssembly (`.wasm`) and builds the Go server binary.*

### Launch Backend API Server
```bash
make run-backend
```
*Starts the Golang API. On startup, the server automatically runs database migrations and seeds the catalog products, demo user profiles, and active invoices.*

### Launch React Frontend
```bash
make run-frontend
```
*Launches the Vite Dev Server. Open `http://localhost:5173` on your browser to view the app.*

---

## 🤖 Running the End-to-End Simulation

We have created an automated workflow simulation script that executes the complete business logic via the REST API step-by-step (connects wallets, creates a credit request, supplier approves, funder escrows, supplier ships, warung receives, and warung pays).

To trigger the automated simulation:
```bash
make simulate
```
*This script will output colored log messages for each step, and verify the reputation score and credit limits update successfully!*

---

## 📦 How the Blockchain Integration Works
1. **Off-Chain State**: Main product, request, and repayment transactions are managed in a PostgreSQL database.
2. **On-Chain Escrow**: Funds are locked in the `warung_supplier_credit` smart contract on **Stellar Testnet** using the Freighter Wallet.
3. **Double Signature Pattern**:
   - The Go backend constructs the unsigned transaction payload in XDR format.
   - The React frontend requests signature authorization via the **Freighter Wallet Extension**.
   - The signed XDR is returned to the backend, which submits it to Stellar RPC and logs the transaction hashes into database records.
