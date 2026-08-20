// DEMO-ONLY mock of the Freighter extension API (installs only when the real
// Freighter extension is absent). Uses a fixed demo keypair funded on testnet.
import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk";

const DEMO_SECRET = "SAKHYMFKQPRC6W7WMX5SKESNGHRGRRQFZFLAFOMC4R4GWHVX33WVFDO6";

if (!window.freighter) {
  const kp = Keypair.fromSecret(DEMO_SECRET);
  window.freighterApi = {
    isConnected: async () => true,
    getPublicKey: async () => kp.publicKey(),
    getNetwork: async () => ({ network: "TESTNET", networkPassphrase: Networks.TESTNET }),
    signTransaction: async (xdr, opts) => {
      const tx = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase || Networks.TESTNET);
      tx.sign(kp);
      return tx.toXDR();
    },
  };
  console.log("[demo] freighter mock active (demo account)");
}