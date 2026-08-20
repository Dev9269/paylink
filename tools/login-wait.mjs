import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILE = "C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\chrome-risein";
const COOKIE_FILE = "C:\\Users\\jaina\\paylink\\.config\\risein-cookies.json";

fs.mkdirSync(PROFILE, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  userDataDir: PROFILE,
  defaultViewport: { width: 1280, height: 900 },
  args: ["--disable-blink-features=AutomationControlled", "--remote-debugging-port=9222"],
});

const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 12000));

const v = await page.evaluate(async () => {
  try {
    const r = await fetch("https://api.risein.com/api/auth/get-session", { credentials: "include" });
    const j = await r.json();
    const u = (j && (j.user || (j.session && j.session.user))) || null;
    return { ok: !!u, email: u ? u.email : null, name: u ? u.name : null, id: u ? u.id : null };
  } catch (e) { return { ok: false, why: e.message }; }
});

console.log("SESSION CHECK:", JSON.stringify(v));

if (v.ok) {
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(await page.cookies(), null, 2));
  console.log("cookies saved");
  const txt = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, " | ").slice(0, 2000);
  console.log("PAGE:", txt);
} else {
  console.log("still not logged in");
}

process.on("SIGINT", () => { browser.close(); process.exit(0); });
await new Promise(() => {});