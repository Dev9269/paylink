import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/background-survey/5CekiI6OPdYcruSUu", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 5000));

const probe = await page.evaluate(() => {
  const areas = [...document.querySelectorAll("textarea")].map(t => ({ ph: t.placeholder, val: (t.value || "").slice(0, 60) }));
  const checks = [...document.querySelectorAll("input[type=checkbox]")].map(c => ({ name: c.name, checked: c.checked }));
  const btns = [...document.querySelectorAll("button")].filter(b => /submit/i.test(b.innerText || "")).map(b => ({ text: b.innerText.trim().slice(0, 40), disabled: b.disabled }));
  return { areas, checks, btns };
});
console.log(JSON.stringify(probe, null, 1));
await page.close();
process.exit(0);