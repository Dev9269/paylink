import puppeteer from "puppeteer-core";
import fs from "node:fs";

const EMAIL = process.env.RISEIN_EMAIL;
const PASSWORD = process.env.RISEIN_PASSWORD;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

if (!EMAIL || !PASSWORD) {
  console.error("set RISEIN_EMAIL and RISEIN_PASSWORD env vars");
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  defaultViewport: { width: 1280, height: 900 },
  args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
});

const page = await browser.newPage();
await page.goto("https://www.risein.com/sign-in", { waitUntil: "networkidle2", timeout: 90000 });

await page.waitForSelector('input[type="email"]', { timeout: 30000 });
await page.type('input[type="email"]', EMAIL, { delay: 25 });
await page.type('input[type="password"]', PASSWORD, { delay: 25 });

await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find(b => b.textContent.toLowerCase().includes("sign in"));
  if (btn) btn.click();
});

await new Promise(r => setTimeout(r, 6000));

const url = page.url();
console.log("url after submit:", url);
const pageText = (await page.evaluate(() => document.body.innerText)).slice(0, 1500);
console.log("---page text---");
console.log(pageText);

let cookies = await page.cookies();
cookies = cookies.filter(c => c.name.includes("session") || c.name.includes("auth") || c.name.includes("sb-"));
console.log("---auth cookies---");
for (const c of cookies) console.log(c.name, c.domain, c.value.slice(0, 40) + "...");
fs.writeFileSync("C:\\Users\\jaina\\paylink\\.config\\risein-cookies.json", JSON.stringify(await page.cookies(), null, 2));
console.log("cookies saved");

if (cookies.length === 0) {
  await new Promise(r => setTimeout(r, 15000));
  const text2 = (await page.evaluate(() => document.body.innerText)).slice(0, 1000);
  console.log("---after wait---");
  console.log(text2);
}

await browser.close();