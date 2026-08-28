import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 6000));
const txt = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, " | ");
const i = txt.indexOf("Task Summary");
console.log(txt.slice(i, i + 700));
await page.close();
process.exit(0);