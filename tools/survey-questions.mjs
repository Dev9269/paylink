import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
let task = null;
page.on("response", async r => {
  if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
    try { const j = await r.json(); if (j.data?.taskById) task = j.data.taskById; } catch {}
  }
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/background-survey/5CekiI6OPdYcruSUu", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 9000));

if (task) {
  const t = task.task;
  console.log("task keys:", Object.keys(t).join(","));
  console.log("form:", JSON.stringify(t.form || null).slice(0, 2000));
  console.log("backgroundSurvey:", JSON.stringify(t.backgroundSurvey || null).slice(0, 2000));
}
await page.close();
process.exit(0);