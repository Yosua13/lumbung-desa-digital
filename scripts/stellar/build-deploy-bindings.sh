#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NETWORK_NAME="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${STELLAR_SOURCE_ACCOUNT:-wsc-testnet}"
BINDINGS_OUT_DIR="${BINDINGS_OUT_DIR:-$REPO_ROOT/packages/pool_escrow}"
ENV_OUT_FILE="${ENV_OUT_FILE:-$REPO_ROOT/.env.stellar.local}"

# shellcheck disable=SC1090
source "$HOME/.cargo/env" 2>/dev/null || true

if ! command -v stellar >/dev/null 2>&1; then
  echo "stellar CLI is not installed. Run: bash scripts/stellar/setup-ubuntu.sh" >&2
  exit 1
fi

echo "Building Soroban contracts..."
pushd "$REPO_ROOT/contracts" >/dev/null
stellar contract build
popd >/dev/null

WASM="$REPO_ROOT/contracts/target/wasm32v1-none/release/pool_escrow.wasm"
if [[ ! -f "$WASM" ]]; then
  echo "Compiled wasm not found at $WASM" >&2
  exit 1
fi

echo "Uploading wasm to Stellar $NETWORK_NAME..."
WASM_HASH="$(
  stellar contract upload \
    --source-account "$SOURCE_ACCOUNT" \
    --network "$NETWORK_NAME" \
    --wasm "$WASM"
)"

echo "Deploying contract instance..."
CONTRACT_ID="$(
  stellar contract deploy \
    --source-account "$SOURCE_ACCOUNT" \
    --network "$NETWORK_NAME" \
    --wasm-hash "$WASM_HASH"
)"

echo "Generating TypeScript bindings..."
stellar contract bindings typescript \
  --network "$NETWORK_NAME" \
  --id "$CONTRACT_ID" \
  --output-dir "$BINDINGS_OUT_DIR" \
  --overwrite

cat > "$ENV_OUT_FILE" <<EOF
VITE_ENABLE_LIVE_STELLAR="true"
VITE_STELLAR_NETWORK="$NETWORK_NAME"
VITE_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
VITE_STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
VITE_WSC_POOL_ESCROW_CONTRACT_ID="$CONTRACT_ID"
EOF

echo "Contract deployed."
echo "WASM hash: $WASM_HASH"
echo "Contract ID: $CONTRACT_ID"
echo "Bindings: $BINDINGS_OUT_DIR"
echo "Env file: $ENV_OUT_FILE"
echo "Next for Windows frontend only, if needed: pnpm add file:./packages/pool_escrow"
