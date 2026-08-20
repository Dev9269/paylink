import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/18OmQr65EW5ymwySp", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 6000));

const txt = await page.evaluate(() => document.body.innerText);
const i = txt.indexOf("👉 Overview");
console.log("FULL L1 TEXT:\n" + txt.slice(i, i + 4500));

const ghBtn = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /connect github/i.test(x.innerText || ""));
  if (b) { b.click(); return "clicked"; }
  return "not found";
});
console.log("GITHUB BTN:", ghBtn);
await new Promise(r => setTimeout(r, 6000));
console.log("URL AFTER:", page.url().slice(0, 120));

await page.close();
process.exit(0);