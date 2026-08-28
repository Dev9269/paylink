import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
const reqs = [];
page.on("request", r => { if (r.method() === "POST") reqs.push(r.method() + " " + r.url().slice(0, 140)); });

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));

const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (!b) return "no button";
  b.scrollIntoView({ block: "center" });
  b.click();
  return "clicked";
});
console.log("clicked:", clicked);
await new Promise(r => setTimeout(r, 6000));
console.log("POST requests during click:", JSON.stringify(reqs, null, 1));

const state = await page.evaluate(() => ({
  hasMark: document.body.innerText.includes("Mark as complete"),
  hasCompleted: /completed|Completed/i.test(document.body.innerText),
}));
console.log("state:", JSON.stringify(state));
await page.close();
process.exit(0);