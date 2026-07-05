# Demo Walkthrough (5-Minute Guide)

Follow this guide to demonstrate the complete, end-to-end lifecycle of the **Warung Supplier Credit** system.

## Preparation
1. Ensure your local PostgreSQL server is running.
2. Launch the Go API:
   ```bash
   go run apps/api/cmd/api/main.go
   ```
3. Launch the React Web App:
   ```bash
   cd apps/web
   npm run dev
   ```
4. Access the web dashboard (usually `http://localhost:5173`).
5. Open your **Freighter Wallet**, connect, and switch your wallet network to **Testnet**.

---

## The 5-Minute Demo Flow

### Minute 1: Connect Wallet & Link Demo Profiles
- Open the web application.
- Click **Connect Wallet** using Freighter.
- On the dark demo panel at the top, click **Link as Bu Sari (Warung)**.
  - This maps your connected wallet address to the seeded warung profile.
  - Inspect the mobile card displaying: Plafon Available limit `Rp20.750.000` (outstanding is `Rp4.250.000` from the pre-seeded active invoice `INV-2025-0501`).
  - Observe the Reputation Score at `720`.

### Minute 2: Browse Products & Request Stock
- On the mobile simulator, click the **Belanja** tab at the bottom.
- Select products: e.g. add `2 bags of Rojo Lele Rice`.
- Click **Ajukan Kredit Stok** at the bottom.
- The available plafon limit instantly decreases (credit is reserved).

### Minute 3: Supplier Approves Order (Smart Contract Init)
- Switch the role view at the top of the navbar to **Supplier**.
- Observe the supplier dashboard displaying `Pending Requests: 1`.
- Go to the **Permintaan Stok** table, locate Bu Sari's request, and click **Setujui & Buat Kontrak**.
- The backend automatically invokes `create_invoice` on the Soroban smart contract using the server admin keys.
- Copy the generated transaction hash and observe that the invoice is now registered on-chain.

### Minute 4: Funder Locks Escrow & Supplier Ships
- Switch the role view to **Funder/Admin**.
- Locate the newly approved invoice in the table, click **Fund ke Escrow**.
- Freighter will prompt you to sign the transaction. Approve the signature.
  - *Assets are now locked in the escrow smart contract.*
- Switch the role view to **Supplier**.
- Locate the invoice (status: `Funded`) and click **Tandai Barang Dikirim**.
- Approve the Freighter signature to mark it as `Shipped`.

### Minute 5: Confirm Receipt & Pay Cicilan
- Switch the role view back to **Warung (Mobile)**.
- Locate the active invoice under the dashboard list, and click on it.
- Observe the progress tracker timeline showing status is `Shipped`.
- Click **Konfirmasi Barang Diterima**.
- Approve the Freighter signature.
  - * escrow funds are instantly released to the supplier's wallet, and the invoice status transitions to `Repaying`.*
- Scroll down to inspect the newly generated repayment schedule (split into 5 installments).
- Click **Bayar** next to the first installment.
- Approve the Freighter signature to pay.
  - *Outstanding debt decreases, the available credit limit is restored, and your Reputation Score increases to 735!*
