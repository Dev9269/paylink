import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });

const MESSAGES = {
  zLD7OI0BUvUusdOgS: "Level 2 - Yellow Belt: Soroban smart contract + multi-wallet integration + real-time events + multisig.\n\nDelivered: paylink-contract (Soroban escrow in Rust) deployed on testnet (contract CAUAHW4XE2F7VMWTOIUBHV43CQAVD6SR7CFD2UCHTHW5U7ZJSLJETOMN). level2/index.mjs integrates wallet-style signers (basicNodeSigner), deploys/creates/funds/claims escrow links, streams on-chain events via rpc.getEvents, and sets a 2-of-2 multisig threshold so payments require both merchant and operator signatures - all verified on testnet with tx hashes.",
  qQ16Ti2J20cR75yy7: "Level 3 - Orange Belt: full dApp on top of the contract.\n\nDelivered: level3/ - Express API + dashboard (create payment links, QR codes, live payment event feed) + pay page with SEP-7 web+stellar:pay deep link. Level 1 web dApp in level1-web/ (Freighter connect, balance, send with tx feedback). Runs on testnet, end-to-end tested in a real browser (create link -> pay -> claim with on-chain events streamed live)."
};

const taskIds = ["zLD7OI0BUvUusdOgS", "qQ16Ti2J20cR75yy7"];

for (const id of taskIds) {
  const page = await browser.newPage();
  const posts = [];
  page.on("request", r => {
    if (r.method() === "POST" && /api\.risein\.com\/graphql/.test(r.url()) && !/cdn-cgi/.test(r.url())) {
      posts.push((r.postData() || "").slice(0, 120));
    }
  });
  console.log(`\n=== ${id} ===`);
  await page.goto(`https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/${id}`, { waitUntil: "domcontentloaded", timeout: 120000 });
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
    if (!opt) return "not found";
    opt.click(); return "clicked";
  });
  console.log("pick:", picked);
  await new Promise(r => setTimeout(r, 3500));

  const ta = await page.$("textarea");
  if (ta) {
    await ta.click({ clickCount: 3 });
    await ta.type(MESSAGES[id], { delay: 4 });
    await new Promise(r => setTimeout(r, 1200));
  }
  const sub = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find(x => /submit for review/i.test(x.innerText || ""));
    if (!b) return "no submit btn";
    b.scrollIntoView({ block: "center" }); b.click(); return "submitted";
  });
  console.log("submit:", sub);
  await new Promise(r => setTimeout(r, 8000));
  const final = await page.evaluate(() => ({
    hasSubmitBtn: /submit for review/i.test(document.body.innerText),
    repoSelected: /github\.com\/Dev9269\/paylink/i.test(document.body.innerText)
  }));
  console.log("final:", JSON.stringify(final));
  console.log("mutation:", posts.filter(p => /submit|updateTaskCompletion|upsert|createTaskCompletion|completeSubmission/i.test(p)).join("\n") || "(none)");
  await page.screenshot({ path: `C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\submit-${id.slice(0, 6)}.png` });
  await page.close();
}
process.exit(0);