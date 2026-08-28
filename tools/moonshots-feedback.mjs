import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));

const TASKS = [
  ["moonshots", "ondQ5f-kFkU3lmpE", "MS2S3hmDXqerSvdcW", "L1 New Moon"],
  ["moonshots", "ondQ5f-kFkU3lmpE", "K7CxZD1QjK5zhzL8u", "L2 Waxing Crescent"],
  ["moonshots", "ondQ5f-kFkU3lmpE", "msnM8wbPBJwwuX9wG", "L3 First Quarter"],
  ["moonshots", "ondQ5f-kFkU3lmpE", "MvAC1yHMUnbrCBgyj", "Idea"],
  ["stellar", "HrDjqCAA8yxTm1yn", "18OmQr65EW5ymwySp", "L1 White"],
  ["stellar", "HrDjqCAA8yxTm1yn", "zLD7OI0BUvUusdOgS", "L2 Yellow"],
  ["stellar", "HrDjqCAA8yxTm1yn", "qQ16Ti2J20cR75yy7", "L3 Orange"],
  ["stellar", "HrDjqCAA8yxTm1yn", "5CekiI6OPdYcruSUu", "Idea"],
  ["stellar", "HrDjqCAA8yxTm1yn", "GVcSgGTy0xxCw07lp", "Startup Idea"],
];

const out = await page.evaluate(async (TASKS) => {
  const res = [];
  for (const [, cohortId, taskId, label] of TASKS) {
    const r = await fetch("https://api.risein.com/graphql", {
      method: "POST", credentials: "include", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        operationName: "taskById",
        variables: { taskId },
        query: `query taskById($taskId: NonEmptyString!) { taskById(taskId: $taskId) { _id task { _id title } taskCompletion { _id isCompleted moderationStatus currentStatus submittedAt updatedAt reviewedAt } feedback { raw _id __typename } review { raw _id __typename } } }`
      })
    }).then(r => r.json());
    const d = r.data?.taskById;
    const tc = d?.taskCompletion;
    res.push({ program: "stellar", label, mod: tc?.moderationStatus ?? null, feedback: tc ? Object.keys(tc).filter(k => /feed|review|message|note|reject/i.test(k)) : [], raw: JSON.stringify(tc ?? d).slice(0, 600) });
    await new Promise(s => setTimeout(s, 250));
  }
  return res;
}, TASKS);

console.log(out.map(o => `--- ${o.label} [${o.mod}] ---\n${o.raw}`).join("\n"));
await page.close();
process.exit(0);