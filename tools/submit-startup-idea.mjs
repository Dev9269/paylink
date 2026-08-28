import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 4000));

const essay = [
  "PayLink - payments for the Stellar economy via shareable Soroban-backed payment links.",
  "",
  "Startup: a web app where any merchant or freelancer creates a payment link (amount, payee, asset) that deploys a Soroban escrow on Stellar. The customer opens the link or scans a QR and pays with any Stellar wallet; the merchant claims funds when the goods are delivered. Escrow guarantees funds are locked until claimed, only the payee can claim, and double funding/claiming is impossible - every step emits an on-chain event streamed live to a dashboard.",
  "",
  "Traction/differentiation: no app install or address copy-paste needed - the link works in any chat, email or QR scanner. Built for cross-border freelancers, small merchants, creators and community fundraisers.",
  "",
  "Built so far (all on testnet, on-chain verified): Soroban escrow contract in Rust, Freighter wallet dApp, contract integration with live event streaming and 2-of-2 multisig, and a full dashboard app with QR payment links and a live payment feed.",
  "",
  "Roadmap: L4 production MVP with USDC via the native Asset Contract and SEP-7 web+stellar:pay deep links; L5 acquire users and publish traction/pitch; L6 deploy to mainnet with real payments; L7 anchor on/off-ramp, multi-asset escrow and recurring links."
].join("\n");

const out = await page.evaluate(async ({ taskId, cohortId, essay }) => {
  const body = JSON.stringify({
    operationName: "updateBackgroundSurveyTask",
    variables: {
      taskId, cohortId,
      answers: [{ questionId: "vKngWd9Ux3", selectionIds: [], essayAnswer: essay }],
      isCompleted: true
    },
    query: `mutation updateBackgroundSurveyTask($taskId: NonEmptyString!, $cohortId: NonEmptyString!, $answers: [AnswerInput!]!, $isCompleted: Boolean, $period: String) { updateBackgroundSurveyTask(taskId: $taskId, cohortId: $cohortId, answers: $answers, isCompleted: $isCompleted, period: $period) { _id taskId isCompleted currentStatus moderationStatus } }`
  });
  const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
  return { status: r.status, json: await r.json() };
}, { taskId: "GVcSgGTy0xxCw07lp", cohortId: "HrDjqCAA8yxTm1yn", essay });

console.log("status:", out.status);
console.log(JSON.stringify(out.json, null, 1).slice(0, 800));
await page.close();
process.exit(0);