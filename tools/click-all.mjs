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

const btns = await page.evaluate(() => {
  return [...document.querySelectorAll("button")].map((b, i) => ({
    i, text: (b.innerText || "").trim().slice(0, 60), d: b.disabled,
    cls: (b.className || "").toString().slice(0, 40)
  })).filter(x => /mark as complete|complete/i.test(x.text));
});
console.log("MATCHING BUTTONS:", JSON.stringify(btns, null, 1));

for (const b of btns.filter(x => /mark as complete/i.test(x.text))) {
  window.__fetches = null;
  const r = await page.evaluate(i => {
    const b = [...document.querySelectorAll("button")][i];
    window.__fetches = [];
    b.scrollIntoView({ block: "center" });
    return { before: b.disabled, text: b.innerText.slice(0, 50) };
  }, b.i);
  await new Promise(s => setTimeout(s, 800));
  const post = await page.evaluate(i => {
    const b = [...document.querySelectorAll("button")][i];
    if (!b) return "gone";
    b.click();
    return "clicked";
  }, b.i);
  await new Promise(s => setTimeout(s, 3500));
  const after = await page.evaluate(i => {
    const el = document.querySelectorAll("button")[i];
    return {
      stillThere: !!el, nowText: el ? el.innerText.slice(0, 50) : null,
      fetches: (window.__fetches || []).filter(f => !f.url.includes("facebook") && !f.url.includes("clarity") && !f.url.includes("google") && !f.url.includes("doubleclick") && !f.url.includes("pagead")),
      hasMark: /mark as complete/i.test(document.body.innerText)
    };
  }, b.i);
  console.log(`BTN#${b.i} ${JSON.stringify(r)} -> ${post} ->`, JSON.stringify(after));
}
await page.close();
process.exit(0);