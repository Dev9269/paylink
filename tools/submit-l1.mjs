import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
const posts = [];
page.on("request", r => {
  if (r.method() === "POST" && /api\.risein\.com\/graphql/.test(r.url()) && !/cdn-cgi/.test(r.url())) {
    posts.push((r.postData() || "").slice(0, 140));
  }
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/18OmQr65EW5ymwySp", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 12000));

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /select a repository/i.test(x.innerText || ""));
  if (b) { b.scrollIntoView({ block: "center" }); b.click(); }
});
await page.waitForFunction(() => {
  return [...document.querySelectorAll("[role=option]")].some(o => /github\.com\/Dev9269\/paylink/i.test(o.innerText || ""));
}, { timeout: 30000, polling: 300 }).catch(() => {});

const picked = await page.evaluate(() => {
  const opt = [...document.querySelectorAll("[role=option]")].find(o => /github\.com\/Dev9269\/paylink/i.test(o.innerText || ""));
  if (!opt) return "paylink option not found";
  opt.click();
  return "clicked paylink option";
});
console.log("PICK:", picked);
await new Promise(r => setTimeout(r, 4000));

const afterPick = await page.evaluate(() => ({
  selected: (document.body.innerText.match(/paylink[^\n]*/g) || []).slice(0, 2),
  buttons: [...document.querySelectorAll("button")].map(b => (b.innerText || "").trim().replace(/\s+/g, " ").slice(0, 70)).filter(x => /submit|repositor|paylink/i.test(x))
}));
console.log("AFTER PICK:", JSON.stringify(afterPick, null, 1));

const ta = await page.$("textarea");
if (ta) {
  await ta.click({ clickCount: 3 });
  await ta.type("PayLink - shareable XLM payment links backed by a Soroban escrow contract.\n\nDelivered: level1-web (Freighter wallet dApp: connect/disconnect, balance display, send XLM on testnet with tx-hash feedback), paylink-contract (Soroban escrow in Rust, deployed on testnet, create/fund/claim verified on-chain), level2 (contract integration, live event streaming, 2-of-2 multisig), level3 (merchant dashboard with QR payment links and live payment feed). Public repo with README + screenshots, 10+ meaningful commits.", { delay: 5 });
  await new Promise(r => setTimeout(r, 1500));
  console.log("textarea value len:", await page.evaluate(() => document.querySelector("textarea").value.length));
}

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /submit for review/i.test(x.innerText || ""));
  if (b) { b.scrollIntoView({ block: "center" }); b.click(); }
});
await new Promise(r => setTimeout(r, 9000));

const final = await page.evaluate(() => ({
  hasSubmitBtn: /submit for review/i.test(document.body.innerText),
  body: document.body.innerText.replace(/\s+/g, " ").slice(0, 500)
}));
console.log("FINAL:", JSON.stringify(final, null, 1));
console.log("POSTS:", posts.filter(p => !/taskById|Notification|getUserRating|GetTaskComments|checkGithub|getGithubRepositories|getDefaultBackground/.test(p)).join("\n") || "(only known queries)");
await page.screenshot({ path: "C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\l1-final.png" });
await page.close();
process.exit(0);