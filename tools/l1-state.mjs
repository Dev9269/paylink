import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
let task = null;
page.on("response", async r => {
  if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
    try { const j = await r.json(); if (j.data?.taskById) task = j.data.taskById; } catch {}
  }
});
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/18OmQr65EW5ymwySp", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 12000));

const s = await page.evaluate(() => {
  const repoInputs = [...document.querySelectorAll("input")].map(i => ({ type: i.type, placeholder: i.placeholder, value: i.value, aria: i.getAttribute("aria-label") }));
  const btns = [...document.querySelectorAll("button")].map(b => b.innerText.trim().slice(0, 40)).filter(Boolean);
  const body = document.body.innerText.replace(/\s+/g, " ");
  return {
    inputs: repoInputs.filter(i => i.type === "text" || i.type === "search"),
    buttons: btns.filter(x => /pick|repositor|submit|connect|select/i.test(x)),
    body: body.slice(0, 900),
    connected: /(connected|reconnect github)/i.test(body)
  };
});
console.log(JSON.stringify(s, null, 1).slice(0, 2200));

if (task) {
  const tc = task.taskCompletion;
  console.log("taskCompletion:", JSON.stringify({ isCompleted: tc?.isCompleted, status: tc?.currentStatus, mod: tc?.moderationStatus, repo: tc?.repository, subs: tc?.submissions }));
}
await page.close();
process.exit(0);