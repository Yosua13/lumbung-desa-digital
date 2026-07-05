# Smart Contract Specification

This document details the Soroban smart contract `warung_supplier_credit` logic, storage, and interfaces.

## 1. Data Structures

### InvoiceStatus (Enum)
- `Requested` (0): Invoice created, waiting for supplier approval/funder lock.
- `Approved` (1): Approved by supplier, waiting to be funded.
- `Funded` (2): Escrow funded by Funder.
- `Shipped` (3): Marked as shipped by Supplier.
- `Delivered` (4): Received by Warung.
- `Released` (5): Escrow released to Supplier.
- `Repaying` (6): Active repayment phase.
- `Paid` (7): Invoice fully paid.
- `Disputed` (8): Placed in dispute state by Warung/Supplier.
- `Cancelled` (9): Cancelled and refunded by Admin.
- `Defaulted` (10): Unpaid overdue state.

### Invoice (Struct)
```rust
struct Invoice {
    id: u64,
    warung: Address,
    supplier: Address,
    funder: Address,
    asset: Address,
    amount: i128,
    outstanding: i128,
    installment_count: u32,
    paid_installments: u32,
    due_timestamp: u64,
    status: InvoiceStatus,
    created_at: u64,
    updated_at: u64
}
```

### Reputation (Struct)
```rust
struct Reputation {
    warung: Address,
    score: u32,
    total_invoice: u32,
    paid_on_time: u32,
    late_payment: u32,
    default_count: u32
}
```

---

## 2. Core Functions

| Function Name | Caller Auth | Logic |
|---|---|---|
| `initialize(admin, asset)` | Deployer | Sets up administrative permissions and default token. |
| `create_invoice(...)` | Warung or Admin | Instantiates and registers a new invoice starting in `Requested` status. |
| `approve_invoice(id)` | Supplier | Transitions invoice status to `Approved`. |
| `fund_invoice(id, funder)` | Funder | Transfers token balance from funder to contract address, updates status to `Funded`. |
| `mark_shipped(id)` | Supplier | Sets status to `Shipped`. |
| `confirm_delivery(id)` | Warung | Sets status to `Delivered`, automatically executes funds release to supplier. |
| `pay_installment(id, payer, amount)` | Warung | Transfers partial amount from warung to funder, reduces outstanding debt, increases reputation score. |
| `open_dispute(id)` | Warung / Supplier | Flags the invoice as `Disputed`. |
| `resolve_dispute(id, release)` | Admin | Distributes locked funds depending on verdict (to supplier if true, refunded to funder if false). |
