import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 10000));

const s = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  body: document.body.innerText.replace(/\s+/g, " ").slice(0, 1200)
}));
console.log(JSON.stringify(s, null, 1));
await page.screenshot({ path: "C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\moonshots-1.png" });
await page.close();
process.exit(0);