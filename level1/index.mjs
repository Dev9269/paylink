// Level 1 (White Belt): wallets, balances, first on-chain transactions
// Run: npm run level1
import sdk from "@stellar/stellar-sdk";
const { Keypair, Horizon, TransactionBuilder, Networks, Operation, BASE_FEE, Asset } = sdk;
const Server = Horizon.Server;

const server = new Server("https://horizon-testnet.stellar.org");
const FRIENDBOT = "https://friendbot.stellar.org";

function log(tag, msg) {
  console.log(`[${tag}] ${msg}`);
}

async function fundWithFriendbot(pubkey) {
  log("fund", `Requesting testnet funds for ${pubkey}`);
  const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(pubkey)}`);
  if (!res.ok) throw new Error(`Friendbot failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function balanceOf(pubkey, asset = Asset.native()) {
  const acc = await server.loadAccount(pubkey);
  const bal = acc.balances.find((b) => b.asset_type === (asset.isNative() ? "native" : "credit_alphanum4") || b.asset_type === "credit_alphanum12");
  return bal ? parseFloat(bal.balance) : 0;
}

async function submit(tx, keypair, label) {
  tx.sign(keypair);
  const res = await server.submitTransaction(tx);
  log("tx", `${label} → https://stellar.expert/explorer/testnet/tx/${res.hash}`);
  return res;
}

async function main() {
  log("setup", "Level 1: wallet creation + first on-chain transactions");

  // 1. Create a wallet
  const alice = Keypair.random();
  const bob = Keypair.random();
  log("wallet", `Alice: ${alice.publicKey()}`);
  log("wallet", `Bob:   ${bob.publicKey()}`);

  // 2. Fund both via friendbot (testnet faucet)
  await fundWithFriendbot(alice.publicKey());
  await fundWithFriendbot(bob.publicKey());

  // 3. Check balances
  const aliceBal = await balanceOf(alice.publicKey());
  const bobBal = await balanceOf(bob.publicKey());
  log("balance", `Alice: ${aliceBal} XLM`);
  log("balance", `Bob:   ${bobBal} XLM`);
  if (aliceBal <= 0 || bobBal <= 0) throw new Error("Funding failed");

  // 4. First transaction: Alice sends 5 XLM to Bob
  let source = await server.loadAccount(alice.publicKey());
  const sendTx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.payment({
      destination: bob.publicKey(),
      asset: Asset.native(),
      amount: "5",
    }))
    .setTimeout(30)
    .build();
  await submit(sendTx, alice, "Alice → Bob: 5 XLM");

  // 5. Verify balances updated on-chain
  const aliceAfter = await balanceOf(alice.publicKey());
  const bobAfter = await balanceOf(bob.publicKey());
  log("verify", `Alice: ${aliceAfter} XLM (expected ~${(aliceBal - 5 - 0.00001).toFixed(5)})`);
  log("verify", `Bob:   ${bobAfter} XLM (expected ${(bobBal + 5).toFixed(1)})`);
  if (Math.abs(bobAfter - (bobBal + 5)) > 0.01) throw new Error("Balance check failed");
  if (aliceAfter >= aliceBal) throw new Error("Alice balance should have decreased");

  // 6. Second transaction: Bob creates a trustline for a custom token (issuer must exist on-chain first)
  const tokenIssuer = Keypair.random();
  const usd = new Asset("PAYL", tokenIssuer.publicKey());
  await fundWithFriendbot(tokenIssuer.publicKey());
  source = await server.loadAccount(bob.publicKey());
  const trustTx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: usd }))
    .setTimeout(30)
    .build();
  await submit(trustTx, bob, "Bob: trustline for custom PAYL token");

  log("done", "Level 1 complete: wallet creation, funding, balances, transactions, trustlines ✓");
  console.log("Wallets:", JSON.stringify({ alice: alice.secret(), bob: bob.secret(), issuer: tokenIssuer.secret() }, null, 2));
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});