import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
const posts = [];
page.on("request", r => {
  if (r.method() === "POST" && !r.url().includes("cdn-cgi/rum") && !r.url().includes("clarity")) {
    posts.push(r.url() + " :: " + (r.postData() || "").slice(0, 500));
  }
});
let tc = null;
page.on("response", async r => {
  if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
    try { const j = await r.json(); if (j.data?.taskById) tc = j.data.taskById; } catch {}
  }
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

const before = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (!b) return null;
  b.scrollIntoView({ block: "center" });
  return true;
});
await new Promise(r => setTimeout(r, 1000));

posts.length = 0;
const result = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (!b) return "no button";
  b.click();
  return "clicked";
});
await new Promise(r => setTimeout(r, 7000));

const after = await page.evaluate(() => ({
  hasMark: /mark as complete/i.test(document.body.innerText),
  hasCompleted: /completed/i.test(document.body.innerText)
}));

console.log("before:", before, "| click:", result);
console.log("POSTS:", posts.length ? posts.join("\n") : "(none)");
console.log("after:", JSON.stringify(after));
console.log("taskCompletion:", tc ? JSON.stringify({ isCompleted: tc.taskCompletion?.isCompleted, status: tc.taskCompletion?.currentStatus, canComplete: tc.taskCompletion?.canComplete }) : "not refetched");
await page.close();
process.exit(0);