import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/18OmQr65EW5ymwySp", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 12000));

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /select a repository/i.test(x.innerText || ""));
  if (b) { b.scrollIntoView({ block: "center" }); b.click(); }
});
console.log("opened picker");
await new Promise(r => setTimeout(r, 8000));

const state = await page.evaluate(() => {
  const all = [...document.querySelectorAll("button,[role=option],[role=menuitem],li")];
  const matches = all.filter(x => /paylink|dev-fitness|github\.com/i.test(x.innerText || "")).map(x => ({
    tag: x.tagName, role: x.getAttribute("role"), text: x.innerText.replace(/\s+/g, " ").slice(0, 70)
  }));
  const dialogs = [...document.querySelectorAll("[role=dialog]")].map(d => d.getAttribute("aria-label") || d.className.toString().slice(0, 40));
  return { matches, dialogs };
});
console.log(JSON.stringify(state, null, 1));
await page.screenshot({ path: "C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\picker-state.png" });
await page.close();
process.exit(0);