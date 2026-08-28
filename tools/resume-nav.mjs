import puppeteer from "puppeteer-core";
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 5000));
const all = await page.evaluate(() => [...document.querySelectorAll("a")].map(a => a.href).filter(Boolean).slice(0, 80));
console.log("ANCHORS:\n" + [...new Set(all)].join("\n"));
// try clicking Resume learning
const clicked = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("a,button")].find(el => /resume|continue|level 1/i.test(el.innerText || ""));
  if (btn) { btn.click(); return btn.innerText; }
  return null;
});
console.log("CLICKED:", clicked);
await new Promise(r => setTimeout(r, 6000));
console.log("NOW:", page.url());
const txt = await page.evaluate(() => (document.body.innerText || "").slice(0, 4000));
console.log("TEXT:\n" + txt);
await page.close();
process.exit(0);
