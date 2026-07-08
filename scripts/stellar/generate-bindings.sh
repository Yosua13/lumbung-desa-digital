#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NETWORK_NAME="${STELLAR_NETWORK:-testnet}"
CONTRACT_ID="${WSC_POOL_ESCROW_CONTRACT_ID:-${VITE_WSC_POOL_ESCROW_CONTRACT_ID:-}}"
BINDINGS_OUT_DIR="${BINDINGS_OUT_DIR:-$REPO_ROOT/packages/pool_escrow}"

if [[ -z "$CONTRACT_ID" ]]; then
  echo "Set WSC_POOL_ESCROW_CONTRACT_ID or VITE_WSC_POOL_ESCROW_CONTRACT_ID first." >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$HOME/.cargo/env" 2>/dev/null || true

stellar contract bindings typescript \
  --network "$NETWORK_NAME" \
  --id "$CONTRACT_ID" \
  --output-dir "$BINDINGS_OUT_DIR" \
  --overwrite

echo "Generated bindings for $CONTRACT_ID at $BINDINGS_OUT_DIR"
