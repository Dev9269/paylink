import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  window.__fetches = [];
  const orig = window.fetch;
  window.fetch = (...args) => {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
    window.__fetches.push({ url, method: args[1]?.method || "GET", body: (args[1]?.body || "").toString().slice(0, 200) });
    return orig(...args);
  };
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

const idx = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].findIndex(x => /mark as complete/i.test(x.innerText || ""));
  return b;
});
console.log("index:", idx);

await page.evaluate(() => { window.__fetches = []; });
await page.evaluate(i => {
  const b = [...document.querySelectorAll("button")][i];
  b.scrollIntoView({ block: "center" });
  return b.disabled;
}, idx);
await new Promise(r => setTimeout(r, 800));

const fired = await page.evaluate(i => {
  const b = [...document.querySelectorAll("button")][i];
  if (!b) return "gone";
  b.click();
  return "clicked";
}, idx);
await new Promise(r => setTimeout(r, 4000));

const after = await page.evaluate(i => {
  const el = document.querySelectorAll("button")[i];
  return {
    stillThere: !!el, nowText: el ? el.innerText.slice(0, 50) : null,
    fetches: (window.__fetches || []).filter(f => !/facebook|clarity|google|doubleclick|pagead|analytics|gtm/.test(f.url)),
    hasMark: /mark as complete/i.test(document.body.innerText),
    hasCompleted: /Completed/i.test(document.body.innerText)
  };
}, idx);
console.log(fired, "->", JSON.stringify(after, null, 1));
await page.close();
process.exit(0);