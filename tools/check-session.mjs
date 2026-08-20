import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE = "C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\chrome-risein";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: false, userDataDir: PROFILE, defaultViewport: { width: 1280, height: 900 }, args: ["--disable-blink-features=AutomationControlled"] });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));
console.log("url:", page.url().slice(0, 100));
const sesh = await page.evaluate(async () => {
  try {
    const r = await fetch("https://api.risein.com/api/auth/get-session", { credentials: "include" });
    return { status: r.status, body: (await r.text()).slice(0, 600) };
  } catch (e) { return { err: e.message }; }
});
console.log("session:", JSON.stringify(sesh));
const text = (await page.evaluate(() => document.body.innerText)).slice(0, 400);
console.log("page:", text.replace(/\n+/g, " | ").slice(0, 300));
await browser.close();