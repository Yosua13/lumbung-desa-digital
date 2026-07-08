import { stellarConfig } from "../config/stellar";

export interface LockFundingArgs {
  invoiceId: string;
  funderAddress: string;
  warungAddress: string;
  supplierAddress: string;
  cooperativeAddress: string;
  amountStroops: bigint;
}

export interface ReleaseFundingArgs {
  invoiceId: string;
  approverAddress: string;
}

export interface RefundFundingArgs {
  invoiceId: string;
  approverAddress: string;
}

export interface PostRepaymentArgs {
  invoiceId: string;
  payerAddress: string;
  amountStroops: bigint;
}

export interface PoolEscrowBinding {
  lockFunding(args: LockFundingArgs): Promise<string>;
  releaseFunding(args: ReleaseFundingArgs): Promise<string>;
  refundFunding(args: RefundFundingArgs): Promise<string>;
  postRepayment(args: PostRepaymentArgs): Promise<string>;
}

export class MissingPoolEscrowBinding implements PoolEscrowBinding {
  async lockFunding(): Promise<string> {
    return this.missingBindingError();
  }

  async releaseFunding(): Promise<string> {
    return this.missingBindingError();
  }

  async refundFunding(): Promise<string> {
    return this.missingBindingError();
  }

  async postRepayment(): Promise<string> {
    return this.missingBindingError();
  }

  private missingBindingError(): never {
    throw new Error(
      "Pool Escrow binding belum tersedia. Jalankan scripts/stellar/build-deploy-bindings.sh di Ubuntu/WSL setelah kontrak Soroban berhasil dideploy.",
    );
  }
}

export function createPoolEscrowBinding(): PoolEscrowBinding {
  if (!stellarConfig.enableLiveStellar || !stellarConfig.poolEscrowContractId) {
    return new MissingPoolEscrowBinding();
  }

  return new MissingPoolEscrowBinding();
}

export function rupiahToContractAmount(amount: number): bigint {
  return BigInt(Math.round(amount));
}
