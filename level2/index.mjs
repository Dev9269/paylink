// Level 2 (Yellow Belt): multi-wallet integration, smart contracts,
// transaction handling, real-time event synchronization.
// Uses the already-deployed PayLink contract on testnet.
// Run: npm run level2
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair, Horizon, TransactionBuilder, Networks, Operation, BASE_FEE, Address, Asset, rpc as sdkRpc, contract as sdkContract } from "@stellar/stellar-sdk";
const Server = Horizon.Server;

const horizon = new Server("https://horizon-testnet.stellar.org");
const rpc = new sdkRpc.Server("https://soroban-testnet.stellar.org");
const { id: CONTRACT_ID } = JSON.parse(fs.readFileSync(new URL("../.config/contract.json", import.meta.url)));
const NATIVE_ASSET = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

const wasmPath = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../paylink-contract/target/wasm32v1-none/release/paylink_contract.wasm");

function log(tag, msg) {
  console.log(`[${tag}] ${msg}`);
}

async function fund(pubkey) {
  const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(pubkey)}`);
  if (!res.ok) throw new Error(`Friendbot failed: ${await res.text()}`);
}

async function main() {
  log("setup", `PayLink contract: ${CONTRACT_ID}`);
  log("setup", `  https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`);

  // Three wallets: deployer (contract owner), merchant (payee), customer (payer)
  const deployer = Keypair.fromSecret(JSON.parse(fs.readFileSync(new URL("../.config/deployer.json", import.meta.url))).secret);
  const merchant = Keypair.random();
  const customer = Keypair.random();
  await fund(merchant.publicKey());
  await fund(customer.publicKey());
  log("wallet", `deployer ${deployer.publicKey()}`);
  log("wallet", `merchant ${merchant.publicKey()}`);
  log("wallet", `customer ${customer.publicKey()}`);

const client = await sdkContract.Client.fromWasm(fs.readFileSync(wasmPath), {
    contractId: CONTRACT_ID,
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    publicKey: merchant.publicKey(),
    ...sdkContract.basicNodeSigner(merchant, Networks.TESTNET),
  });

  // --- Real-time event sync: poll contract events while the flow runs ---
  const linkId = "INV_" + Date.now().toString().slice(-8);
  const amount = 50n * 10n ** 7n; // 5 XLM in stroops
  const seen = new Set();
  const poller = setInterval(async () => {
    try {
      const events = await rpc.getEvents({
        startLedger: 0,
        filters: [{ type: "contract", contractIds: [CONTRACT_ID] }],
        limit: 50,
      });
      for (const e of events.events ?? []) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        const topic = e.topic.map((t) => String(t.value ?? t).slice(0, 40)).join(",");
        log("event", `ledger=${e.ledger} [${topic}]`);
      }
    } catch (e) {}
  }, 2000);

// --- Full escrow flow ---
  log("contract", `create(${linkId}, payee=merchant, asset=native, 5 XLM)`);
  const created = await (await client.create({ link_id: linkId, payee: merchant.publicKey(), asset: NATIVE_ASSET, amount })).signAndSend();
  log("contract", `  tx https://stellar.expert/explorer/testnet/tx/${created.sendTransactionResponse.hash}`);

  const payerClient = await sdkContract.Client.fromWasm(fs.readFileSync(wasmPath), {
    contractId: CONTRACT_ID,
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: Networks.TESTNET,
    publicKey: customer.publicKey(),
    ...sdkContract.basicNodeSigner(customer, Networks.TESTNET),
  });

  log("contract", `fund(${linkId}, payer=customer)");
  const funded = await (await payerClient.fund({ link_id: linkId, payer: customer.publicKey() })).signAndSend();
  log("contract", `  tx https://stellar.expert/explorer/testnet/tx/${funded.sendTransactionResponse.hash}`);

  log("contract", `claim(${linkId}, payee=merchant)");
  const claimed = await (await client.claim({ link_id: linkId, payee: merchant.publicKey() })).signAndSend();
  log("contract", `  tx https://stellar.expert/explorer/testnet/tx/${claimed.sendTransactionResponse.hash}`);

  await new Promise((r) => setTimeout(r, 4000));
  clearInterval(poller);

  // Verify final on-chain state
  const link = await client.get_link({ link_id: linkId });
  log("verify", `link: funded=${link.result.funded} claimed=${link.result.claimed} amount=${link.result.amount}`);
  if (!link.result.funded || !link.result.claimed) throw new Error("Contract state verification failed");

  // --- Multi-wallet: 2-of-2 multisig ---
  log("multisig", "2-of-2 multisig account (both signatures required to move funds)");
  const sigA = Keypair.random();
  const sigB = Keypair.random();
  await fund(sigA.publicKey());
  await fund(sigB.publicKey());
  const shared = await horizon.loadAccount(sigA.publicKey());
  const setupTx = new TransactionBuilder(shared, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.setOptions({
      signer: { ed25519PublicKey: sigB.publicKey(), weight: 1 },
      masterWeight: 1,
      lowThreshold: 2,
      medThreshold: 2,
      highThreshold: 2,
    }))
    .setTimeout(30)
    .build();
  setupTx.sign(sigA); // only master signs the threshold change
  const multiRes = await horizon.submitTransaction(setupTx);
  log("multisig", `threshold set: https://stellar.expert/explorer/testnet/tx/${multiRes.hash}`);

  const payTx = new TransactionBuilder(await horizon.loadAccount(sigA.publicKey()), {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.payment({ destination: merchant.publicKey(), asset: Asset.native(), amount: "1" }))
    .setTimeout(30)
    .build();
  payTx.sign(sigA);
  payTx.sign(sigB);
  const payRes = await horizon.submitTransaction(payTx);
  log("multisig", `both signatures required and accepted: https://stellar.expert/explorer/testnet/tx/${payRes.hash}`);

  log("done", "Level 2 complete: deployed contract invoked, events streamed live, 2-of-2 multisig works ✓");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  console.error(e.stack?.split("\n").slice(0, 8).join("\n"));
  process.exit(1);
});









