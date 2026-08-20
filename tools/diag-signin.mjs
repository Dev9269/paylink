import puppeteer from "puppeteer-core";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, defaultViewport: { width: 1280, height: 900 }, args: ["--disable-blink-features=AutomationControlled"] });
const page = await browser.newPage();
await page.goto("https://www.risein.com/sign-in", { waitUntil: "networkidle2", timeout: 90000 });
await page.waitForSelector('input[type="email"]', { timeout: 30000 });
await new Promise(r => setTimeout(r, 4000));
const info = await page.evaluate(() => {
  const iframes = [...document.querySelectorAll("iframe")].map(f => f.src);
  const inputs = [...document.querySelectorAll("input")].map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder, id: i.id }));
  const buttons = [...document.querySelectorAll("button")].map(b => ({ text: (b.textContent || "").trim().slice(0, 40), disabled: b.disabled, cls: (b.className || "").slice(0, 60) }));
  const errText = (document.querySelector('[role="alert"], .text-destructive, [data-slot="alert"]') || {}).textContent;
  return { iframes, inputs, buttons, errText };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: "C:\\Users\\jaina\\paylink\\.config\\signin-screen.png" });
await browser.close();