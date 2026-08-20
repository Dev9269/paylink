# PayLink — Product Idea (Level 4+)

## One-liner

**PayLink** turns any amount of XLM into a shareable payment link backed by a
Soroban escrow contract — no app install, no address copy-paste.

## Problem

Stellar payments today require the payee to share a long public key and the
payer to know exactly how to construct a transaction. For merchants and
freelancers this is friction that loses sales: invoices are error-prone,
escrow requires trust, and there is no "pay me" link to drop into a chat,
email, or QR code.

## Solution

1. A merchant creates a payment link in one click → the app deploys a Soroban
   escrow entry on testnet (later mainnet) for that link with the amount,
   payee and asset locked in.
2. The customer opens the link (web page or QR), sees exactly what they pay
   and to whom, and funds the escrow with one click.
3. The merchant claims the funds when the service/goods are delivered. The
   contract guarantees: funds are locked until claimed, only the payee can
   claim, double funding/claiming is impossible, and every step emits an
   on-chain event that the merchant dashboard streams live.

## Why Stellar

- **Payments are Stellar's core use case** — one of the program's priority
  themes (payments, stablecoins, cross-border).
- Escrow on Soroban is cheap (testnet costs nothing; mainnet tx fees are
  fractions of a stroop) — realistic for a real product.
- Future iterations: USDC via the native Asset Contract (SAC), SEP-7 deep
  links (`web+stellar:pay`) so wallets like Lobstr/Freighter open directly,
  and anchor integration for on/off-ramp.

## Market / users

- Freelancers, small merchants, creators, and community fundraisers on Stellar.
- Global audience (cross-border), low barrier: a link works in any chat app.

## Roadmap (Level 4 → 7)

- **L4 (Green):** production MVP — stable dashboard, USDC support, SEP-7
  deep links, README + docs, 20+ testnet users from the community.
- **L5 (Blue):** 50 users, pitch + traction slides.
- **L6 (Black):** mainnet deployment with real (small) payments.
- **L7 (Master):** anchor on/off-ramp, multi-asset escrow, recurring links.

## Files in this repo

- `paylink-contract/` — Soroban escrow contract (Rust, deployed on testnet)
- `level1-web/` — Freighter wallet dApp
- `level2/` — contract integration + event streaming + multisig demo
- `level3/` — full dApp: dashboard, QR payment links, live payment feed