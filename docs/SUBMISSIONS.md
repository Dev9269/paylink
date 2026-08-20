# PayLink — Submission Evidence

Proof of the on-chain work referenced in the Level 1–3 submissions.

## Level 1 (White Belt)

- Freighter wallet dApp (`level1-web/`): connect / disconnect, balance display,
  send XLM on testnet with success/failure feedback including the tx hash.
- Testnet send tx hash: `fee695a95e6b19d49c62e135...`
- Screenshots: `.config/screenshots/l1-{initial,connected,sent}.png`
  (also mirrored in `level1-web/screenshots/`).

## Level 2 (Yellow Belt)

- Soroban escrow contract (`paylink-contract/`), deployed on testnet.
- Contract address:
  `CAUAHW4XE2F7VMWTOIUBHV43CQAVD6SR7CFD2UCHTHW5U7ZJSLJETOMN`
- Deployer:
  `GA5BCVRPNDAKOPV6VLWVG7HCB7ZFROPTZQ7JNRT43OKGHAUVH44VHFWW`
- Verified on-chain (`level2/index.mjs`): create → fund → claim (funded=true,
  claimed=true, amount=500000000), events streamed via `rpc.getEvents`, and a
  2-of-2 multisig threshold set so payments require both merchant and operator
  signatures.
- Build: `cargo build --target wasm32v1-none --release`

## Level 3 (Orange Belt)

- Full dApp (`level3/`): Express API + merchant dashboard + pay page.
- Merchant creates a payment link → QR code → customer pays → merchant claims.
- Every step emits an on-chain event; the dashboard streams them live (`/api/events`).
- Pay page includes a SEP-7 `web+stellar:pay` deep link for wallet apps.
- End-to-end tested in a real browser on testnet.

## Live services (local dev)

- `level1-web`: `npm run level1-web` (port 3100)
- `level3`: `npm run level3` (port 3001)