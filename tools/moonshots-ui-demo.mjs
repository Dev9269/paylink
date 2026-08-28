import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1000 });
await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle0", timeout: 30000 });
await page.waitForFunction(() => document.querySelector('#ledger')?.textContent.includes('total = 0'), { timeout: 15000 });
await new Promise(r => setTimeout(r, 800));

const shot = (name) =>
  page.screenshot({ path: `C:/Users/jaina/midnight-moonshots/screenshots/${name}.png` });

await shot("01-home");

await page.click("#connect");
await new Promise(r => setTimeout(r, 400));

await page.evaluate(() => {
  document.querySelector("#total").value = "1000";
  document.querySelector("#payee-count").value = "3";
});
await page.click("#create");
await new Promise(r => setTimeout(r, 400));
await shot("02-created");

await page.evaluate(() => {
  document.querySelector("#amount").value = "500";
});
await page.click("#fund");
await new Promise(r => setTimeout(r, 400));
await shot("03-funded");

await page.evaluate(() => {
  document.querySelector("#share").value = "250";
});
await page.click("#claim");
await new Promise(r => setTimeout(r, 400));
await shot("04-claimed");

const ledgerText = await page.$eval("#ledger", el => el.textContent);
const logText = await page.$eval("#log", el => el.textContent);
console.log("LEDGER:", ledgerText);
console.log("LOG:\n" + logText);
await page.close();
process.exit(0);
