import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
const toasts = [];
page.on("console", m => { if (/toast|error|warn/i.test(m.text())) toasts.push(m.text().slice(0, 200)); });

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

const info = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
if (info) await page.mouse.click(info.x, info.y);
await new Promise(r => setTimeout(r, 5000));

const toasts2 = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-slot="toast"], [role="status"], [role="alert"]')].map(e => e.innerText.slice(0, 120));
  return els;
});
console.log("console toasts:", JSON.stringify(toasts));
console.log("dom toasts:", JSON.stringify(toasts2));
await page.close();
process.exit(0);