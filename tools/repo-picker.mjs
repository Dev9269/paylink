import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/18OmQr65EW5ymwySp", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 12000));

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /select a repository/i.test(x.innerText || ""));
  if (b) b.click();
});
await new Promise(r => setTimeout(r, 5000));

const s = await page.evaluate(() => {
  const dialogs = [...document.querySelectorAll('[role="dialog"], [data-slot="dialog-content"]')].map(d => d.innerText.replace(/\s+/g, " ").slice(0, 400));
  const inputs = [...document.querySelectorAll('[role="dialog"] input, [data-slot="dialog-content"] input')].map(i => ({ type: i.type, placeholder: i.placeholder }));
  const repoItems = [...document.querySelectorAll('[role="dialog"] button, [role="option"], [data-slot="dialog-content"] button')].map(b => b.innerText.trim().replace(/\s+/g, " ").slice(0, 60)).filter(Boolean);
  return { dialogs, inputs, repoItems };
});
console.log(JSON.stringify(s, null, 1));
await page.screenshot({ path: "C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\repo-dialog.png" });
await page.close();
process.exit(0);