import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/background-survey/5CekiI6OPdYcruSUu", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 6000));

const info = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll("input, textarea, select")].map(i => ({
    tag: i.tagName, type: i.type || "", name: i.name || "", placeholder: (i.placeholder || "").slice(0, 80), aria: (i.getAttribute("aria-label") || "").slice(0, 80), cls: (i.className || "").toString().slice(0, 40),
  }));
  const labels = [...document.querySelectorAll("label")].map(l => (l.innerText || "").replace(/\s+/g, " ").trim().slice(0, 100));
  const btns = [...new Set([...document.querySelectorAll("button")].map(b => (b.innerText || "").replace(/\s+/g, " ").trim().slice(0, 50)).filter(Boolean))];
  return { inputs, labels, btns };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: "C:\\Users\\jaina\\paylink\\.config\\screenshots\\idea-form.png" });
await page.close();
process.exit(0);