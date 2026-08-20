import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SHOTS = "C:\\Users\\jaina\\paylink\\.config\\screenshots";
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", defaultViewport: { width: 1100, height: 800 } });
const page = await browser.newPage();
await page.goto("http://localhost:3100/?demo", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: SHOTS + "\\l1-initial.png" });

await page.click("#connectBtn");
await new Promise(r => setTimeout(r, 3000));
console.log("connState:", await page.$eval("#connState", el => el.textContent));
console.log("balance:", await page.$eval("#balance", el => el.textContent));
console.log("pubkey:", await page.$eval("#pubkey", el => el.textContent));
await page.screenshot({ path: SHOTS + "\\l1-connected.png" });

const dest = (await import("@stellar/stellar-sdk")).Keypair.random().publicKey();
await fetch(`https://friendbot.stellar.org?addr=${dest}`);
await page.type("#dest", dest);
await page.type("#amount", "0.1");
await page.click("#sendBtn");
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const txt = await page.$eval("#txResult", el => el.textContent);
  console.log("txResult:", txt.slice(0, 80));
  if (txt.includes("Success")) break;
}
await page.screenshot({ path: SHOTS + "\\l1-sent.png" });

await browser.close();
process.exit(0);