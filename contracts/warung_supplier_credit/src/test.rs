#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, testutils::Address as _, token};

#[test]
fn test_invoice_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    
    // Register mock token using Stellar Asset Contract utility
    let asset = env.register_stellar_asset_contract(admin.clone());
    
    let contract_id = env.register_contract(None, WarungSupplierCreditContract);
    let client = WarungSupplierCreditContractClient::new(&env, &contract_id);

    client.initialize(&admin, &asset);

    let warung = Address::generate(&env);
    let supplier = Address::generate(&env);

    let amount = 1000000i128;
    let inst_count = 2u32;
    let due = 10000u64;

    // 1. Create Invoice
    let inv_id = client.create_invoice(&warung, &supplier, &amount, &inst_count, &due);
    assert_eq!(inv_id, 1);

    let inv = client.get_invoice(&inv_id);
    assert_eq!(inv.amount, amount);
    assert_eq!(inv.status, InvoiceStatus::Requested);

    // Verify reputation initialized and total count increased
    let initial_rep = client.get_reputation(&warung);
    assert_eq!(initial_rep.score, 720);
    assert_eq!(initial_rep.total_invoice, 1);

    // 2. Approve Invoice
    client.approve_invoice(&inv_id);
    assert_eq!(client.get_invoice(&inv_id).status, InvoiceStatus::Approved);

    // 3. Fund Invoice
    let funder = Address::generate(&env);
    let token_admin = token::StellarAssetClient::new(&env, &asset);
    token_admin.mint(&funder, &amount); // Fund the funder's balance

    client.fund_invoice(&inv_id, &funder);
    assert_eq!(client.get_invoice(&inv_id).status, InvoiceStatus::Funded);

    // 4. Mark Shipped
    client.mark_shipped(&inv_id);
    assert_eq!(client.get_invoice(&inv_id).status, InvoiceStatus::Shipped);

    // 5. Confirm Delivery (which triggers automatic release of funds to supplier)
    client.confirm_delivery(&inv_id);
    assert_eq!(client.get_invoice(&inv_id).status, InvoiceStatus::Repaying);

    // Supplier should have received the funds
    let token_client = token::Client::new(&env, &asset);
    assert_eq!(token_client.balance(&supplier), amount);

    // 6. Pay Installments
    token_admin.mint(&warung, &amount); // Fund the warung's balance for repayment

    // Pay 1st installment (half of total amount)
    client.pay_installment(&inv_id, &warung, &(amount / 2));
    let inv_after_pay1 = client.get_invoice(&inv_id);
    assert_eq!(inv_after_pay1.outstanding, amount / 2);
    assert_eq!(inv_after_pay1.paid_installments, 1);
    assert_eq!(inv_after_pay1.status, InvoiceStatus::Repaying);

    // Pay 2nd installment (completing invoice)
    client.pay_installment(&inv_id, &warung, &(amount / 2));
    let inv_after_pay2 = client.get_invoice(&inv_id);
    assert_eq!(inv_after_pay2.outstanding, 0);
    assert_eq!(inv_after_pay2.status, InvoiceStatus::Paid);

    // Reputation score should have increased
    let final_rep = client.get_reputation(&warung);
    assert_eq!(final_rep.score, 750); // 720 + 15 + 15 = 750
    assert_eq!(final_rep.paid_on_time, 2);
}

#[test]
fn test_dispute_flow_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let asset = env.register_stellar_asset_contract(admin.clone());
    let contract_id = env.register_contract(None, WarungSupplierCreditContract);
    let client = WarungSupplierCreditContractClient::new(&env, &contract_id);

    client.initialize(&admin, &asset);

    let warung = Address::generate(&env);
    let supplier = Address::generate(&env);
    let funder = Address::generate(&env);

    let amount = 1000000i128;
    
    // Initialize
    let inv_id = client.create_invoice(&warung, &supplier, &amount, &2, &10000);
    client.approve_invoice(&inv_id);
    
    // Fund
    let token_admin = token::StellarAssetClient::new(&env, &asset);
    token_admin.mint(&funder, &amount);
    client.fund_invoice(&inv_id, &funder);

    // Ship
    client.mark_shipped(&inv_id);

    // Dispute instead of confirming delivery
    client.open_dispute(&inv_id);
    assert_eq!(client.get_invoice(&inv_id).status, InvoiceStatus::Disputed);

    // Resolve Dispute: refund to funder (release_to_supplier = false)
    client.resolve_dispute(&inv_id, &false);
    assert_eq!(client.get_invoice(&inv_id).status, InvoiceStatus::Cancelled);

    // Funder should get their money back
    let token_client = token::Client::new(&env, &asset);
    assert_eq!(token_client.balance(&funder), amount);
    assert_eq!(token_client.balance(&supplier), 0);

    // Warung reputation should be docked
    let reputation = client.get_reputation(&warung);
    assert_eq!(reputation.score, 670); // 720 - 50 = 670
    assert_eq!(reputation.default_count, 1);
}
