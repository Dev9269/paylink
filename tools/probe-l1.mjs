import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", defaultViewport: { width: 1100, height: 800 } });
const page = await browser.newPage();
page.on("console", m => console.log("[console]", m.type(), m.text().slice(0, 150)));
page.on("requestfailed", r => console.log("[reqfail]", r.url().slice(0, 100), r.failure()?.errorText));
await page.goto("http://localhost:3100/?demo", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise(r => setTimeout(r, 2000));
const probe = await page.evaluate(() => ({
  sdk: !!window.StellarSdk,
  fa: !!window.freighterApi,
  freighter: !!window.freighter,
  mock: !!window.__mockInstalled,
}));
console.log("PROBE:", JSON.stringify(probe));
await browser.close();
process.exit(0);