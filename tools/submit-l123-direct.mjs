import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));

const repository = { id: 1340237758, name: "paylink", html_url: "https://github.com/Dev9269/paylink" };
const DESC = {
  "18OmQr65EW5ymwySp": "Level 1 - White Belt: first working Stellar dApp on testnet.\n\nDelivered in the paylink repo (level1-web/): a Freighter wallet dApp that connects/disconnects the wallet, fetches and displays the XLM balance, and sends XLM on testnet with success/failure feedback including the transaction hash. Verified end-to-end in a real browser on the Stellar testnet (send tx: fee695a95e6b19d49c62e135...). README with screenshots included.",
  "zLD7OI0BUvUusdOgS": "Level 2 - Yellow Belt: smart contract + multi-wallet integration + real-time events + multisig.\n\nDelivered in the paylink repo: paylink-contract/ is a Soroban escrow contract in Rust, deployed on testnet (contract CAUAHW4XE2F7VMWTOIUBHV43CQAVD6SR7CFD2UCHTHW5U7ZJSLJETOMN). level2/index.mjs creates/funds/claims escrow links on-chain, streams every event live via rpc.getEvents, and sets a 2-of-2 multisig threshold so payments require both merchant and operator signatures (verified on testnet with tx hashes).",
  "qQ16Ti2J20cR75yy7": "Level 3 - Orange Belt: full dApp on top of the smart contract.\n\nDelivered in the paylink repo: level3/ is an Express app + merchant dashboard that creates payment links, shows QR codes, streams the live on-chain payment feed, and serves a pay page with SEP-7 web+stellar:pay deep links. level1-web/ is the wallet dApp (Freighter). End-to-end tested in a real browser: create link -> customer pays -> merchant claims, with every step emitting and displaying an on-chain event."
};

const out = await page.evaluate(async ({ repository, DESC }) => {
  const res = [];
  for (const [taskId, desc] of Object.entries(DESC)) {
    const body = JSON.stringify({
      operationName: "updateSubmissionTask",
      variables: {
        taskId, cohortId: "HrDjqCAA8yxTm1yn",
        submissions: [],
        submissionDescription: desc,
        repository
      },
      query: `mutation updateSubmissionTask($taskId: NonEmptyString!, $cohortId: NonEmptyString!, $submissions: [SubmissionValuesInput!], $submissionDescription: NonEmptyString, $repository: GithubRepositoryInput, $trackId: String, $period: String) { updateSubmissionTask(taskId: $taskId, cohortId: $cohortId, submissions: $submissions, submissionDescription: $submissionDescription, repository: $repository, trackId: $trackId, period: $period) { _id taskId isCompleted currentStatus moderationStatus repository { name html_url } submissionDescription } }`
    });
    const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
    const j = await r.json();
    const d = j.data?.updateSubmissionTask;
    res.push({ taskId, status: r.status, errors: j.errors?.map(e => e.message) || null, isCompleted: d?.isCompleted, mod: d?.moderationStatus, repo: d?.repository?.html_url, descLen: (d?.submissionDescription || "").length });
    await new Promise(s => setTimeout(s, 500));
  }
  return res;
}, { repository, DESC });

console.log(JSON.stringify(out, null, 1));
await page.close();
process.exit(0);