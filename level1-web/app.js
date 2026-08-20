import { Horizon, TransactionBuilder, Networks, Operation, Asset, BASE_FEE } from "@stellar/stellar-sdk";

const $ = (id) => document.getElementById(id);
const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
const NETWORK_PASSPHRASE = Networks.TESTNET;

const state = { publicKey: null };

function setConn(connected, pubkey) {
  state.publicKey = connected ? pubkey : null;
  $("connState").textContent = connected ? "connected" : "not connected";
  $("connState").className = connected ? "ok" : "muted";
  $("pubkey").textContent = pubkey || "—";
  $("disconnectBtn").disabled = !connected;
  $("sendBtn").disabled = !connected;
  if (!connected) {
    $("balance").textContent = "—";
    $("network").textContent = "—";
  }
}

window.addEventListener("load", async () => {
  try {
    const connected = await window.freighterApi.isConnected();
    const pubkey = connected ? await window.freighterApi.getPublicKey() : null;
    if (pubkey) {
      setConn(true, pubkey);
      await refreshBalance();
      await refreshNetwork();
    }
  } catch {}
});

$("connectBtn").onclick = async () => {
  try {
    const pubkey = await window.freighterApi.getPublicKey();
    setConn(true, pubkey);
    await refreshBalance();
    await refreshNetwork();
    $("txResult").textContent = "Wallet connected ✓";
    $("txResult").className = "ok";
  } catch (e) {
    $("txResult").textContent = "Connection failed: " + e.message + " (Freighter not installed or not unlocked?)";
    $("txResult").className = "err";
  }
};

$("disconnectBtn").onclick = () => {
  setConn(false, null);
  $("txResult").textContent = "Wallet disconnected";
  $("txResult").className = "muted";
};

async function refreshNetwork() {
  try {
    const net = await window.freighterApi.getNetwork();
    $("network").textContent = net.network || net;
  } catch { $("network").textContent = "unknown"; }
}

async function refreshBalance() {
  try {
    const account = await horizon.loadAccount(state.publicKey);
    const balance = account.balances.find((b) => b.asset_type === "native");
    $("balance").textContent = parseFloat(balance.balance).toFixed(2) + " XLM";
  } catch {
    $("balance").textContent = "0.00 XLM (account not funded — use Friendbot)";
  }
}

$("sendBtn").onclick = async () => {
  const dest = $("dest").value.trim();
  const amount = parseFloat($("amount").value);
  if (!dest || !amount || amount <= 0) {
    $("txResult").textContent = "Enter a destination and amount";
    $("txResult").className = "err";
    return;
  }
  $("sendBtn").disabled = true;
  $("txResult").textContent = "Building transaction…";
  $("txResult").className = "muted";
  try {
    const account = await horizon.loadAccount(state.publicKey);
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.payment({ destination: dest, asset: Asset.native(), amount: String(amount) }))
      .setTimeout(60)
      .build();
    const signed = await window.freighterApi.signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
    const signedTx = TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE);
    const result = await horizon.submitTransaction(signedTx);
    $("txResult").innerHTML = "Success ✓ tx hash <a class='mono' href='https://stellar.expert/explorer/testnet/tx/" + result.hash + "' target='_blank'>" + result.hash.slice(0, 24) + "…</a>";
    $("txResult").className = "ok";
    await refreshBalance();
  } catch (e) {
    $("txResult").textContent = "Transaction failed: " + e.message;
    $("txResult").className = "err";
  } finally {
    $("sendBtn").disabled = false;
  }
};