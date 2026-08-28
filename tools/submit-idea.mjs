import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/background-survey/5CekiI6OPdYcruSUu", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 5000));

const ta = await page.evaluate(() => {
  const t = [...document.querySelectorAll("textarea")].find(x => !x.placeholder);
  t.focus();
  return t === document.activeElement;
});
console.log("focused:", ta);

await page.keyboard.type(`PayLink — Stellar Payment Links with Soroban Escrow

Turn any amount of XLM into a shareable payment link backed by an on-chain escrow contract. Merchants and freelancers create a link in one click (Soroban escrow entry locked with amount, payee, asset); customers open the link or scan a QR, see exactly what they pay and to whom, and fund the escrow; the merchant claims funds once the service is delivered. Every step emits on-chain events streamed live to the merchant dashboard.

Why Stellar: payments are Stellar's core use case (a priority theme). Soroban escrow is cheap enough for a real product. Roadmap adds USDC via native asset contract, SEP-7 web+stellar:pay deep links, and anchor on/off-ramp.

Already built and deployed on testnet: Rust escrow contract (create/fund/claim + events), Freighter wallet dApp, full dApp with QR payment links and live payment feed.`, { delay: 2 });

await new Promise(r => setTimeout(r, 2000));
const len = await page.evaluate(() => [...document.querySelectorAll("textarea")].find(x => !x.placeholder).value.length);
console.log("textarea len:", len);

const chk = await page.evaluate(() => {
  const c = [...document.querySelectorAll("input[type=checkbox]")].find(x => !x.name);
  if (c && !c.checked) { c.click(); return "clicked"; }
  return c ? "already checked" : "missing";
});
console.log("checkbox:", chk);
await new Promise(r => setTimeout(r, 2000));

const btn = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /submit for review/i.test(x.innerText || ""));
  if (!b) return "missing";
  b.scrollIntoView({ block: "center" });
  b.click();
  return "clicked";
});
console.log("submit:", btn);
await new Promise(r => setTimeout(r, 6000));

const state = await page.evaluate(() => {
  const t = document.body.innerText;
  const submitted = /submitted successfully|submission received|under review|awaiting review|thank you/i.test(t);
  return { submitted, hasForm: t.includes("Submit for review"), head: t.slice(0, 600).replace(/\n+/g, " | ") };
});
console.log(JSON.stringify(state, null, 1));
await page.screenshot({ path: "C:\\Users\\jaina\\paylink\\.config\\screenshots\\idea-submitted.png" });
await page.close();
process.exit(0);