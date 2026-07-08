# Generated Stellar Bindings

Folder ini disiapkan untuk output TypeScript binding Soroban.

Binding final tidak di-commit sebagai source manual. Jalankan dari Ubuntu/WSL setelah kontrak `contracts/pool_escrow`
berhasil dibuild dan dideploy:

```bash
pnpm run contracts:deploy:testnet
```

Script akan menghasilkan package binding di `packages/pool_escrow` menggunakan:

```bash
stellar contract bindings typescript --network testnet --id <CONTRACT_ID> --output-dir ./packages/pool_escrow --overwrite
```
