// Level 3 (Orange Belt): PayLink dApp - Express backend + frontend
// Payment links with Soroban escrow, QR codes, live payment feed.
// Run: npm run level3
import fs from "node:fs";
import path from "node:path";
import express from "express";
import QRCode from "qrcode";
import { Keypair, Networks, contract as sdkContract } from "@stellar/stellar-sdk";

const CONTRACT_ID = JSON.parse(fs.readFileSync(new URL("../.config/contract.json", import.meta.url))).id;
const NATIVE_ASSET = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const RPC_URL = "https://soroban-testnet.stellar.org";
const rpc = new (await import("@stellar/stellar-sdk")).rpc.Server(RPC_URL);

const CONFIG_DIR = new URL("../.config/", import.meta.url);
const MERCHANT_FILE = new URL("merchant.json", CONFIG_DIR);
const LINKS_FILE = new URL("links.json", CONFIG_DIR);
const PORT = 3001;

let merchant, merchantKeypair;
if (fs.existsSync(MERCHANT_FILE)) {
  merchant = JSON.parse(fs.readFileSync(MERCHANT_FILE, "utf8"));
} else {
  const kp = Keypair.random();
  merchant = { publicKey: kp.publicKey(), secret: kp.secret() };
  merchantKeypair = Keypair.fromSecret(merchant.secret);
  await fetch(`https://friendbot.stellar.org?addr=${merchant.publicKey}`);
  fs.writeFileSync(MERCHANT_FILE, JSON.stringify(merchant, null, 2));
  console.log("[paylink] new merchant wallet funded:", merchant.publicKey);
}
merchantKeypair = Keypair.fromSecret(merchant.secret);
let links = fs.existsSync(LINKS_FILE) ? JSON.parse(fs.readFileSync(LINKS_FILE, "utf8")) : {};

function saveLinks() {
  fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
}

async function clientFor(keypair) {
  return sdkContract.Client.fromWasm(
    fs.readFileSync(new URL("../paylink-contract/target/wasm32v1-none/release/paylink_contract.wasm", import.meta.url)),
    {
      contractId: CONTRACT_ID,
      rpcUrl: RPC_URL,
      networkPassphrase: Networks.TESTNET,
      publicKey: keypair.publicKey(),
      ...sdkContract.basicNodeSigner(keypair, Networks.TESTNET),
    }
  );
}

async function getEvents() {
  try {
    const res = await rpc.getEvents({
      startLedger: 0,
      filters: [{ type: "contract", contractIds: [CONTRACT_ID] }],
      limit: 100,
    });
    return (res.events ?? []).map((e) => {
      const topic = e.topic.map((t) => String(t.value ?? t).slice(0, 42)).join(",");
      return { id: e.id, ledger: e.ledger, topic, data: String(e.value?.value ?? e.value ?? "").slice(0, 60), at: new Date(e.ledgerClosedAt).toISOString() };
    });
  } catch {
    return [];
  }
}

const app = express();
app.use(express.json());
app.use(express.static(new URL("public/", import.meta.url).pathname));

app.get("/api/links", (req, res) => {
  res.json(Object.values(links).map((l) => ({ ...l, url: `${req.protocol}://${req.get("host")}/pay/${l.id}` })));
});

app.post("/api/links", async (req, res) => {
  try {
    const amount = BigInt(Math.round(Number(req.body.amount) * 1e7));
    if (amount <= 0n) throw new Error("amount must be > 0");
    const id = "INV_" + Date.now().toString().slice(-8);
    const client = await clientFor(merchantKeypair);
    const created = await (await client.create({ link_id: id, payee: merchant.publicKey(), asset: NATIVE_ASSET, amount })).signAndSend();
    links[id] = { id, amount: req.body.amount, payee: merchant.publicKey(), status: "pending", created: new Date().toISOString(), tx: created.sendTransactionResponse.hash };
    saveLinks();
    res.json({ ...links[id], url: `${req.protocol}://${req.get("host")}/pay/${id}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/link/:id", async (req, res) => {
  try {
    const client = await clientFor(merchantKeypair);
    const state = await client.get_link({ link_id: req.params.id });
    const l = links[req.params.id] || {};
    res.json({ id: req.params.id, ...l, state: state.result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/link/:id/pay", async (req, res) => {
  try {
    const id = req.params.id;
    const customer = Keypair.random();
    const fr = await fetch(`https://friendbot.stellar.org?addr=${customer.publicKey()}`);
    if (!fr.ok) throw new Error("friendbot failed");
    const client = await clientFor(customer);
    const funded = await (await client.fund({ link_id: id, payer: customer.publicKey() })).signAndSend();
    links[id].status = "funded";
    links[id].fundedTx = funded.sendTransactionResponse.hash;
    saveLinks();
    res.json({ hash: funded.sendTransactionResponse.hash });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/link/:id/claim", async (req, res) => {
  try {
    const id = req.params.id;
    const client = await clientFor(merchantKeypair);
    const claimed = await (await client.claim({ link_id: id, payee: merchant.publicKey() })).signAndSend();
    links[id].status = "claimed";
    links[id].claimedTx = claimed.sendTransactionResponse.hash;
    saveLinks();
    res.json({ hash: claimed.sendTransactionResponse.hash });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/events", async (req, res) => {
  res.json(await getEvents());
});

app.get("/api/qr", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "url required" });
  res.type("png").send(await QRCode.toBuffer(url, { width: 320 }));
});

app.get("/pay/:id", (req, res) => {
  res.sendFile(path.resolve(new URL("public/pay.html", import.meta.url).pathname));
});

app.listen(PORT, () => console.log(`[paylink] dApp running at http://localhost:${PORT}`));