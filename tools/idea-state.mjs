import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
let tc = null;
page.on("response", async r => {
  if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
    try { const j = await r.json(); if (j.data?.taskById) tc = j.data.taskById; } catch {}
  }
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/background-survey/5CekiI6OPdYcruSUu", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 9000));

const state = await page.evaluate(() => ({
  hasTextarea: !!document.querySelector("textarea"),
  textareaValue: document.querySelector("textarea")?.value?.slice(0, 120) || null,
  buttons: [...document.querySelectorAll("button")].map(b => b.innerText.trim().slice(0, 40)).filter(Boolean).slice(0, 10),
  hasSubmitReview: /submit for review/i.test(document.body.innerText),
  hasForm: /what is your idea/i.test(document.body.innerText)
}));
console.log("PAGE:", JSON.stringify(state, null, 1));

if (tc) {
  const k = tc.taskCompletion;
  console.log("taskCompletion:", JSON.stringify({ isCompleted: k?.isCompleted, status: k?.currentStatus, mod: k?.moderationStatus, answers: k?.answers?.map(a => ({ q: a.questionId, s: a.selectionIds, e: (a.essayAnswer || "").slice(0, 60) })), submitted: k?.submissionHistory?.length }));
  console.log("task title:", tc.task?.title);
}
await page.close();
process.exit(0);