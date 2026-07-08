#!/usr/bin/env bash
set -euo pipefail

NETWORK_NAME="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${STELLAR_SOURCE_ACCOUNT:-wsc-testnet}"
RPC_URL="${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}"
NETWORK_PASSPHRASE="${STELLAR_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"

echo "Installing Ubuntu packages..."
sudo apt-get update
sudo apt-get install -y build-essential curl pkg-config libssl-dev

if ! command -v rustup >/dev/null 2>&1; then
  echo "Installing rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
fi

# shellcheck disable=SC1090
source "$HOME/.cargo/env"

rustup update stable
rustup default stable
rustup target add wasm32v1-none

if ! command -v stellar >/dev/null 2>&1; then
  echo "Installing Stellar CLI..."
  cargo install --locked stellar-cli
fi

stellar --version

if ! stellar network ls | grep -q "^${NETWORK_NAME}$"; then
  stellar network add \
    --global "$NETWORK_NAME" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE"
fi

if ! stellar keys ls | grep -q "^${SOURCE_ACCOUNT}$"; then
  stellar keys generate --global "$SOURCE_ACCOUNT" --network "$NETWORK_NAME"
fi

stellar keys fund "$SOURCE_ACCOUNT" --network "$NETWORK_NAME"

echo "Soroban/Stellar testnet setup is ready."
echo "Network: $NETWORK_NAME"
echo "Source account identity: $SOURCE_ACCOUNT"
