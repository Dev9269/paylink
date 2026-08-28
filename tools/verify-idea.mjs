import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/background-survey/5CekiI6OPdYcruSUu", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 5000));
const t = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, " | ");
const i = t.indexOf("💭 Idea Submission");
console.log(t.slice(i, i + 900));
await page.close();
process.exit(0);