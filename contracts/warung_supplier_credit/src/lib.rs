#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, token,
};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum InvoiceStatus {
    Requested = 0,
    Approved = 1,
    Funded = 2,
    Shipped = 3,
    Delivered = 4,
    Released = 5,
    Repaying = 6,
    Paid = 7,
    Disputed = 8,
    Cancelled = 9,
    Defaulted = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invoice {
    pub id: u64,
    pub warung: Address,
    pub supplier: Address,
    pub funder: Address,
    pub asset: Address,
    pub amount: i128,
    pub outstanding: i128,
    pub installment_count: u32,
    pub paid_installments: u32,
    pub due_timestamp: u64,
    pub status: InvoiceStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Reputation {
    pub warung: Address,
    pub score: u32,
    pub total_invoice: u32,
    pub paid_on_time: u32,
    pub late_payment: u32,
    pub default_count: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Asset,
    InvoiceCounter,
    Invoice(u64),
    Reputation(Address),
}

#[contract]
pub struct WarungSupplierCreditContract;

#[contractimpl]
impl WarungSupplierCreditContract {
    pub fn initialize(env: Env, admin: Address, asset: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Asset, &asset);
        env.storage().instance().set(&DataKey::InvoiceCounter, &0u64);
    }

    pub fn create_invoice(
        env: Env,
        warung: Address,
        supplier: Address,
        amount: i128,
        installment_count: u32,
        due_timestamp: u64,
    ) -> u64 {
        let admin = env.storage().instance().get::<_, Address>(&DataKey::Admin).unwrap();
        
        // Require backend admin authority to initialize on-chain invoice record
        admin.require_auth();

        let asset = env.storage().instance().get::<_, Address>(&DataKey::Asset).unwrap();
        let mut counter: u64 = env.storage().instance().get(&DataKey::InvoiceCounter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::InvoiceCounter, &counter);

        let invoice = Invoice {
            id: counter,
            warung: warung.clone(),
            supplier: supplier.clone(),
            funder: admin.clone(), // Default funder to admin initially
            asset: asset.clone(),
            amount,
            outstanding: amount,
            installment_count,
            paid_installments: 0,
            due_timestamp,
            status: InvoiceStatus::Requested,
            created_at: env.ledger().timestamp(),
            updated_at: env.ledger().timestamp(),
        };

        env.storage().instance().set(&DataKey::Invoice(counter), &invoice);

        // Update Reputation Total Invoice
        let mut reputation = Self::get_reputation(env.clone(), warung.clone());
        reputation.total_invoice += 1;
        env.storage().instance().set(&DataKey::Reputation(warung.clone()), &reputation);

        // Emit Event
        env.events().publish(
            (symbol_short!("inv_creat"), counter),
            (warung, supplier, amount),
        );

        counter
    }

    pub fn approve_invoice(env: Env, invoice_id: u64) {
        let mut invoice = Self::get_invoice(env.clone(), invoice_id);
        assert!(invoice.status == InvoiceStatus::Requested, "invalid status");
        
        invoice.supplier.require_auth();
        invoice.status = InvoiceStatus::Approved;
        invoice.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events().publish(
            (symbol_short!("inv_appr"), invoice_id),
            invoice.supplier.clone(),
        );
    }

    pub fn fund_invoice(env: Env, invoice_id: u64, funder: Address) {
        let mut invoice = Self::get_invoice(env.clone(), invoice_id);
        assert!(invoice.status == InvoiceStatus::Approved, "invalid status");

        funder.require_auth();

        // Transfer funds from funder to this contract
        let token_client = token::Client::new(&env, &invoice.asset);
        token_client.transfer(&funder, &env.current_contract_address(), &invoice.amount);

        invoice.funder = funder.clone();
        invoice.status = InvoiceStatus::Funded;
        invoice.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events().publish(
            (symbol_short!("inv_fund"), invoice_id),
            funder,
        );
    }

    pub fn mark_shipped(env: Env, invoice_id: u64) {
        let mut invoice = Self::get_invoice(env.clone(), invoice_id);
        assert!(invoice.status == InvoiceStatus::Funded, "invalid status");

        invoice.supplier.require_auth();
        invoice.status = InvoiceStatus::Shipped;
        invoice.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events().publish(
            (symbol_short!("inv_ship"), invoice_id),
            invoice.supplier.clone(),
        );
    }

    pub fn confirm_delivery(env: Env, invoice_id: u64) {
        let mut invoice = Self::get_invoice(env.clone(), invoice_id);
        assert!(invoice.status == InvoiceStatus::Shipped, "invalid status");

        invoice.warung.require_auth();
        invoice.status = InvoiceStatus::Delivered;
        invoice.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events().publish(
            (symbol_short!("inv_deliv"), invoice_id),
            invoice.warung.clone(),
        );

        // Auto-release funds to supplier upon delivery confirmation
        Self::release_to_supplier_internal(&env, &mut invoice);
    }

    pub fn release_to_supplier(env: Env, invoice_id: u64) {
        let mut invoice = Self::get_invoice(env.clone(), invoice_id);
        assert!(invoice.status == InvoiceStatus::Delivered, "invalid status");
        
        Self::release_to_supplier_internal(&env, &mut invoice);
    }

    fn release_to_supplier_internal(env: &Env, invoice: &mut Invoice) {
        // Transfer escrowed funds to supplier
        let token_client = token::Client::new(env, &invoice.asset);
        token_client.transfer(&env.current_contract_address(), &invoice.supplier, &invoice.amount);

        invoice.status = InvoiceStatus::Repaying;
        invoice.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Invoice(invoice.id), invoice);

        env.events().publish(
            (symbol_short!("inv_rele"), invoice.id),
            invoice.supplier.clone(),
        );
    }

    pub fn pay_installment(env: Env, invoice_id: u64, payer: Address, amount: i128) {
        let mut invoice = Self::get_invoice(env.clone(), invoice_id);
        assert!(
            invoice.status == InvoiceStatus::Repaying || invoice.status == InvoiceStatus::Released,
            "invalid status"
        );

        payer.require_auth();

        // Transfer payment from payer (warung) to funder
        let token_client = token::Client::new(&env, &invoice.asset);
        token_client.transfer(&payer, &invoice.funder, &amount);

        invoice.outstanding -= amount;
        if invoice.outstanding < 0 {
            invoice.outstanding = 0;
        }

        invoice.paid_installments += 1;

        if invoice.outstanding == 0 || invoice.paid_installments >= invoice.installment_count {
            invoice.status = InvoiceStatus::Paid;
        }
        invoice.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        // Update Reputation Score
        let mut reputation = Self::get_reputation(env.clone(), invoice.warung.clone());
        let current_time = env.ledger().timestamp();
        if current_time <= invoice.due_timestamp {
            reputation.paid_on_time += 1;
            reputation.score = reputation.score.saturating_add(15).min(1000);
        } else {
            reputation.late_payment += 1;
            reputation.score = reputation.score.saturating_sub(20).max(300);
        }
        env.storage().instance().set(&DataKey::Reputation(invoice.warung.clone()), &reputation);

        env.events().publish(
            (symbol_short!("inv_pay"), invoice_id),
            (payer, amount, invoice.outstanding),
        );
        env.events().publish(
            (symbol_short!("rep_upd"), invoice.warung.clone()),
            reputation.score,
        );
    }

    pub fn open_dispute(env: Env, invoice_id: u64) {
        let mut invoice = Self::get_invoice(env.clone(), invoice_id);
        assert!(
            invoice.status == InvoiceStatus::Shipped || invoice.status == InvoiceStatus::Delivered,
            "invalid status"
        );

        // Require warung's authority to initiate dispute
        invoice.warung.require_auth();

        invoice.status = InvoiceStatus::Disputed;
        invoice.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events().publish(
            (symbol_short!("disp_ope"), invoice_id),
            invoice.warung.clone(),
        );
    }

    pub fn resolve_dispute(env: Env, invoice_id: u64, release_to_supplier: bool) {
        let admin = env.storage().instance().get::<_, Address>(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut invoice = Self::get_invoice(env.clone(), invoice_id);
        assert!(invoice.status == InvoiceStatus::Disputed, "invalid status");

        let token_client = token::Client::new(&env, &invoice.asset);

        if release_to_supplier {
            // Send funds to supplier
            token_client.transfer(&env.current_contract_address(), &invoice.supplier, &invoice.amount);
            invoice.status = InvoiceStatus::Repaying;
        } else {
            // Refund funds to funder
            token_client.transfer(&env.current_contract_address(), &invoice.funder, &invoice.amount);
            invoice.status = InvoiceStatus::Cancelled;

            // Reduce reputation for dispute loss/cancellation if warung's fault
            let mut reputation = Self::get_reputation(env.clone(), invoice.warung.clone());
            reputation.default_count += 1;
            reputation.score = reputation.score.saturating_sub(50).max(300);
            env.storage().instance().set(&DataKey::Reputation(invoice.warung.clone()), &reputation);
        }

        invoice.updated_at = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events().publish(
            (symbol_short!("disp_res"), invoice_id),
            release_to_supplier,
        );
    }

    pub fn get_invoice(env: Env, invoice_id: u64) -> Invoice {
        env.storage()
            .instance()
            .get(&DataKey::Invoice(invoice_id))
            .expect("invoice not found")
    }

    pub fn get_reputation(env: Env, warung: Address) -> Reputation {
        env.storage()
            .instance()
            .get(&DataKey::Reputation(warung.clone()))
            .unwrap_or(Reputation {
                warung,
                score: 720, // default initial reputasi
                total_invoice: 0,
                paid_on_time: 0,
                late_payment: 0,
                default_count: 0,
            })
    }
}
mod test;
