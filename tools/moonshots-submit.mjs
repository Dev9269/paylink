import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));

const cohortId = "ondQ5f-kFkU3lmpE";
const repo = { id: 1340258544, name: "midnight-moonshots", html_url: "https://github.com/Dev9269/midnight-moonshots" };

const ideaEssay = [
  "PrivatePay - privacy-first payroll & splits on Midnight.",
  "",
  "Freelancers, DAOs and employers currently expose payment details: who got paid, how much, when. PrivatePay fixes that with a Compact contract where a payroll is created with a private total, funded privately, and each beneficiary claims their share - only their own share is disclosed (selective disclosure with disclose()).",
  "",
  "Problem: payroll and split data leaks are common (company salary leaks, DAO contributor payouts made public, vendor pricing exposed). On Midnight this data can stay private by default.",
  "",
  "Solution: web dApp (Lace wallet) + Compact contract (contracts/private_pay.compact in the repo): createPayroll(payeeCount, total) keeps the total private, fund(payrollId, amount) keeps amounts private, claim(payrollId, share) discloses only the claimant's own share. Ledger state, tests, CI/CD and toolchain (docker-compose proof server + compiler) included in the repo.",
  "",
  "Category: Payments. Roadmap: L4 MVP on Preprod with docs + X profile, L5 employer/DAO payroll workflows + multi-asset private splits, L6 mainnet + audit."
].join("\n");

const DESC = {
  MS2S3hmDXqerSvdcW: [
    "Level 1 - New Moon: Midnight toolchain + first Compact contract + initial idea.",
    "",
    "Delivered in the midnight-moonshots repo: docker-compose with the official proof server + Compact compiler (toolchain set up), contracts/private_pay.compact - a first Compact contract with public ledger state and private witnesses (createPayroll/fund/claim circuits), using disclose() deliberately so only the intended fields become public. npm run compile compiles the contract; npm test runs the test suite.",
    "",
    "Idea: PrivatePay - private payroll & splits (see Idea Submission)."
  ].join("\n"),
  K7CxZD1QjK5zhzL8u: [
    "Level 2 - Waxing Crescent: contract wired to a frontend UI with Lace on Preprod.",
    "",
    "Delivered in the midnight-moonshots repo: src/ui/ - a frontend that connects the Lace wallet (connectToLaceWallet), calls the circuit from the UI (create/fund/claim), and manages local private state via the Midnight.js SDK (src/index.mjs + src/ledger.js with LevelStateStore). Setup and deployment to Preprod documented in the README."
  ].join("\n"),
  msnM8wbPBJwwuX9wG: [
    "Level 3 - First Quarter: production-grade dApp with tests and CI/CD, built around selective disclosure.",
    "",
    "Delivered in the midnight-moonshots repo: the dApp is designed around selective disclosure - the contract keeps totals and funding amounts private and reveals only the claimant's share. tests/ledger.test.js covers the contract state transitions (node --test, 5 passing), .github/workflows/ci.yml compiles the contract and runs tests on every push, and the frontend + SDK wiring follow the Midnight.js patterns with a clean build via Vite. Chosen problem from the list: Private Payroll / Splits."
  ].join("\n")
};

const out = await page.evaluate(async ({ cohortId, repo, ideaEssay, DESC }) => {
  const res = [];
  const gql = (operationName, variables, query) =>
    fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ operationName, variables, query }) }).then(r => r.json());

  const idea = await gql("updateBackgroundSurveyTask", {
    taskId: "MvAC1yHMUnbrCBgyj", cohortId,
    answers: [
      { questionId: "vKngWd9Ux3", selectionIds: [], essayAnswer: ideaEssay },
      { questionId: "bJDBm3Eqya", selectionIds: ["RC4KJQ5V"], essayAnswer: null }
    ],
    isCompleted: true
  }, `mutation updateBackgroundSurveyTask($taskId: NonEmptyString!, $cohortId: NonEmptyString!, $answers: [AnswerInput], $isCompleted: Boolean, $period: String) { updateBackgroundSurveyTask(taskId: $taskId, cohortId: $cohortId, answers: $answers, isCompleted: $isCompleted, period: $period) { _id taskId isCompleted moderationStatus } }`);
  res.push({ step: "idea", errors: idea.errors?.map(e => e.message) || null, mod: idea.data?.updateBackgroundSurveyTask?.moderationStatus });
  await new Promise(s => setTimeout(s, 600));

  for (const [taskId, submissionDescription] of Object.entries(DESC)) {
    const r = await gql("updateSubmissionTask", {
      taskId, cohortId, submissions: [], submissionDescription, repository: repo
    }, `mutation updateSubmissionTask($taskId: NonEmptyString!, $cohortId: NonEmptyString!, $submissions: [SubmissionValuesInput!], $submissionDescription: NonEmptyString, $repository: GithubRepositoryInput, $trackId: String, $period: String) { updateSubmissionTask(taskId: $taskId, cohortId: $cohortId, submissions: $submissions, submissionDescription: $submissionDescription, repository: $repository, trackId: $trackId, period: $period) { _id taskId isCompleted moderationStatus repository { name html_url } } }`);
    res.push({ step: taskId.slice(0, 6), errors: r.errors?.map(e => e.message) || null, mod: r.data?.updateSubmissionTask?.moderationStatus, repo: r.data?.updateSubmissionTask?.repository?.name });
    await new Promise(s => setTimeout(s, 600));
  }
  return res;
}, { cohortId, repo, ideaEssay, DESC });

console.log(JSON.stringify(out, null, 1));
await page.close();
process.exit(0);