import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  window.__fetches = [];
  window.__toasts = [];
  const orig = window.fetch;
  window.fetch = (...args) => {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
    window.__fetches.push({ url, method: args[1]?.method || "GET", body: (args[1]?.body || "").toString().slice(0, 200) });
    return orig(...args);
  };
  new MutationObserver(() => {
    document.querySelectorAll("[data-slot=toast]").forEach(e => {
      if (!window.__toasts.includes(e.innerText)) window.__toasts.push(e.innerText.slice(0, 150));
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (b) b.scrollIntoView({ block: "center" });
});
await new Promise(r => setTimeout(r, 1500));

const rect = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
console.log("click at:", JSON.stringify(rect));

if (rect) {
  await page.mouse.click(rect.x, rect.y);
  await new Promise(r => setTimeout(r, 6000));
  const out = await page.evaluate(() => ({
    fetches: window.__fetches.filter(f => !/facebook|clarity|google|doubleclick|pagead|analytics|gtm|/i.test(f.url)),
    toasts: window.__toasts,
    hasMark: /mark as complete/i.test(document.body.innerText),
    hasCompleted: /Completed/i.test(document.body.innerText),
    url: location.href
  }));
  console.log("OUT:", JSON.stringify(out, null, 1));
  await page.screenshot({ path: "C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\after-click.png" });
}
await page.close();
process.exit(0);