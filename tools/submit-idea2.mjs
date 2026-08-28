import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 4000));

const essay = [
  "PayLink turns any amount of XLM into a shareable payment link backed by a Soroban escrow contract - no app install, no address copy-paste.",
  "",
  "Problem: Stellar payments today require the payee to share a long public key and the payer to know how to construct a transaction. Merchants and freelancers lose sales: invoices are error-prone, escrow requires trust, and there is no 'pay me' link to drop into a chat, email, or QR code.",
  "",
  "Solution: (1) A merchant creates a payment link in one click; the app deploys a Soroban escrow entry on testnet for that link with amount, payee and asset locked in. (2) The customer opens the link (web page or QR), sees exactly what they pay and to whom, and funds the escrow with one click. (3) The merchant claims funds when goods are delivered. The contract guarantees funds are locked until claimed, only the payee can claim, double funding/claiming is impossible, and every step emits an on-chain event streamed live to the merchant dashboard.",
  "",
  "Why Stellar: payments are Stellar's core use case and a program priority theme; escrow on Soroban is cheap. Future: USDC via SAC, SEP-7 web+stellar:pay deep links so Lobstr/Freighter open directly, anchor on/off-ramp.",
  "",
  "Users: freelancers, small merchants, creators, community fundraisers on Stellar; a link works in any chat app worldwide.",
  "",
  "Delivered so far: Soroban escrow contract (Rust, deployed on testnet, create/fund/claim verified on-chain), Freighter wallet dApp (level1-web), contract integration with live event streaming and 2-of-2 multisig (level2), full dApp with merchant dashboard, QR payment links and live payment feed (level3). Roadmap: L4 production MVP + USDC + SEP-7; L5 users + pitch; L6 mainnet; L7 anchor on/off-ramp and recurring links."
].join("\n");

const out = await page.evaluate(async ({ taskId, cohortId, essay }) => {
  const body = JSON.stringify({
    operationName: "updateBackgroundSurveyTask",
    variables: {
      taskId, cohortId,
      answers: [{ questionId: "vKngWd9Ux3", selectionIds: [], essayAnswer: essay }],
      isCompleted: true
    },
    query: `mutation updateBackgroundSurveyTask($taskId: NonEmptyString!, $cohortId: NonEmptyString!, $answers: [AnswerInput!]!, $isCompleted: Boolean, $period: String) { updateBackgroundSurveyTask(taskId: $taskId, cohortId: $cohortId, answers: $answers, isCompleted: $isCompleted, period: $period) { _id taskId cohortId taskType answers { questionId selectionIds essayAnswer } isCompleted currentStatus moderationStatus } }`
  });
  const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
  return { status: r.status, json: await r.json() };
}, { taskId: "5CekiI6OPdYcruSUu", cohortId: "HrDjqCAA8yxTm1yn", essay });

console.log("status:", out.status);
console.log(JSON.stringify(out.json, null, 1).slice(0, 1500));
await page.close();
process.exit(0);