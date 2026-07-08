#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, String,
    Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Locked,
    Released,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowRecord {
    pub invoice_id: String,
    pub funder: Address,
    pub warung: Address,
    pub supplier: Address,
    pub cooperative: Address,
    pub amount: i128,
    pub repaid_amount: i128,
    pub status: EscrowStatus,
    pub locked_at: u64,
    pub closed_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Invoice(String),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum PoolEscrowError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    EscrowAlreadyExists = 4,
    EscrowNotFound = 5,
    InvalidStatus = 6,
}

#[contract]
pub struct PoolEscrowContract;

#[contractimpl]
impl PoolEscrowContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, PoolEscrowError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn lock_funding(
        env: Env,
        funder: Address,
        invoice_id: String,
        warung: Address,
        supplier: Address,
        cooperative: Address,
        amount: i128,
    ) -> EscrowRecord {
        funder.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, PoolEscrowError::InvalidAmount);
        }

        let key = DataKey::Invoice(invoice_id.clone());
        if env.storage().persistent().has(&key) {
            panic_with_error!(&env, PoolEscrowError::EscrowAlreadyExists);
        }

        let record = EscrowRecord {
            invoice_id: invoice_id.clone(),
            funder,
            warung,
            supplier,
            cooperative,
            amount,
            repaid_amount: 0,
            status: EscrowStatus::Locked,
            locked_at: env.ledger().timestamp(),
            closed_at: 0,
        };

        env.storage().persistent().set(&key, &record);
        env.events()
            .publish((Symbol::new(&env, "FundLocked"), invoice_id), amount);
        record
    }

    pub fn release_funding(env: Env, cooperative: Address, invoice_id: String) -> EscrowRecord {
        cooperative.require_auth();

        let key = DataKey::Invoice(invoice_id.clone());
        let mut record = Self::read_record(&env, &key);

        if record.status != EscrowStatus::Locked {
            panic_with_error!(&env, PoolEscrowError::InvalidStatus);
        }

        record.status = EscrowStatus::Released;
        record.closed_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &record);
        env.events()
            .publish((Symbol::new(&env, "InvoiceReleased"), invoice_id), record.amount);
        record
    }

    pub fn refund_funding(env: Env, cooperative: Address, invoice_id: String) -> EscrowRecord {
        cooperative.require_auth();

        let key = DataKey::Invoice(invoice_id.clone());
        let mut record = Self::read_record(&env, &key);

        if record.status != EscrowStatus::Locked {
            panic_with_error!(&env, PoolEscrowError::InvalidStatus);
        }

        record.status = EscrowStatus::Refunded;
        record.closed_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &record);
        env.events()
            .publish((Symbol::new(&env, "EscrowRefunded"), invoice_id), record.amount);
        record
    }

    pub fn post_repayment(env: Env, payer: Address, invoice_id: String, amount: i128) -> EscrowRecord {
        payer.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, PoolEscrowError::InvalidAmount);
        }

        let key = DataKey::Invoice(invoice_id.clone());
        let mut record = Self::read_record(&env, &key);

        if record.status != EscrowStatus::Released {
            panic_with_error!(&env, PoolEscrowError::InvalidStatus);
        }

        record.repaid_amount += amount;
        env.storage().persistent().set(&key, &record);
        env.events()
            .publish((Symbol::new(&env, "RepaymentPosted"), invoice_id), amount);
        record
    }

    pub fn get_escrow(env: Env, invoice_id: String) -> EscrowRecord {
        let key = DataKey::Invoice(invoice_id);
        Self::read_record(&env, &key)
    }

    fn read_record(env: &Env, key: &DataKey) -> EscrowRecord {
        env.storage()
            .persistent()
            .get(key)
            .unwrap_or_else(|| panic_with_error!(env, PoolEscrowError::EscrowNotFound))
    }
}
