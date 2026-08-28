import puppeteer from "puppeteer-core";
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 5000));
const links = await page.evaluate(() => [...document.querySelectorAll("a")].map(a => a.href).filter(h => /task|level|submission|feedback/i.test(h)));
console.log([...new Set(links)].join("\n"));
await page.close();
process.exit(0);
