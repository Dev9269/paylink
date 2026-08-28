import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  window.__net = [];
  window.__errs = [];
  const of = window.fetch;
  window.fetch = (...a) => {
    const url = typeof a[0] === "string" ? a[0] : a[0]?.url;
    window.__net.push("fetch " + a[1]?.method + " " + url + " " + (a[1]?.body || "").toString().slice(0, 250));
    return of(...a);
  };
  const oX = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) { window.__net.push("xhr " + m + " " + u); return oX.apply(this, arguments); };
  const oE = console.error;
  console.error = (...a) => { window.__errs.push(a.map(x => String(x).slice(0, 200)).join(" ")); return oE(...a); };
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

const info = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")].filter(x => /mark as complete/i.test(x.innerText || ""));
  return btns.map(b => {
    const r = b.getBoundingClientRect();
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return {
      text: b.innerText.slice(0, 30),
      disabled: b.disabled,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      topIsSelf: top === b,
      topTag: top ? top.tagName : null
    };
  });
});
console.log("BUTTONS:", JSON.stringify(info, null, 1));

const b0 = info[0];
if (b0) {
  const x = b0.rect.x + b0.rect.w / 2, y = b0.rect.y + b0.rect.h / 2;
  await page.evaluate(() => { window.__net = []; window.__errs = []; });
  await page.mouse.click(x, y);
  await new Promise(r => setTimeout(r, 5000));
  const out = await page.evaluate(() => ({
    net: window.__net.filter(s => !/facebook|clarity|google|doubleclick|pagead|analytics|gtm/i.test(s)),
    errs: window.__errs,
    hasMark: /mark as complete/i.test(document.body.innerText),
    hasCompleted: /Completed/i.test(document.body.innerText)
  }));
  console.log("OUT:", JSON.stringify(out, null, 1));
}
await page.close();
process.exit(0);