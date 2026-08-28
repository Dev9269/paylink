import puppeteer from "puppeteer-core";
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
page.on("console", m => console.log("PAGE:", m.text()));
page.on("pageerror", e => console.log("PAGEERROR:", e.message));
await page.goto("http://127.0.0.1:4173", { waitUntil: "load", timeout: 20000 });
await new Promise(r => setTimeout(r, 2500));
const info = await page.evaluate(() => ({
  ledger: document.querySelector("#ledger")?.textContent,
  connectBtn: !!document.querySelector("#connect"),
  app: typeof window.createApp,
  scripts: [...document.scripts].map(s => s.src),
  ready: document.readyState
}));
console.log(JSON.stringify(info, null, 1));
await page.close();
process.exit(0);
