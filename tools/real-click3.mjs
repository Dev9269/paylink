import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();

page.on("console", m => { console.log("CONSOLE:", m.type(), m.text().slice(0, 300)); });
page.on("requestfailed", r => console.log("REQFAIL:", r.url().slice(0, 200), r.failure()?.errorText));

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

await page.evaluate(() => {
  const orig = window.fetch;
  window.__fetches = [];
  window.fetch = (...args) => {
    const url = typeof args[0] === "string" ? args[0] : args[0].url;
    window.__fetches.push({ url, method: args[1]?.method || "GET", body: (args[1]?.body || "").toString().slice(0, 300) });
    return orig(...args);
  };
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (b) b.scrollIntoView({ block: "center" });
});
await new Promise(r => setTimeout(r, 1000));

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (b) b.click();
});
await new Promise(r => setTimeout(r, 6000));

const res = await page.evaluate(() => ({
  fetches: window.__fetches,
  url: location.href,
  hasMark: /mark as complete/i.test(document.body.innerText),
  hasCompleted: /Completed/i.test(document.body.innerText),
  toasts: [...document.querySelectorAll("[data-slot=toast], [role=status]")].map(e => e.innerText.slice(0, 200))
}));
console.log("RESULT:", JSON.stringify(res, null, 1));
await page.close();
process.exit(0);