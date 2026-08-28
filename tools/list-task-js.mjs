import puppeteer from "puppeteer-core";
import fs from "node:fs";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
const js = new Set();
page.on("request", r => {
  const u = r.url();
  if (u.includes("risein.com/assets/") && u.endsWith(".js")) js.add(u.split("/").pop());
});
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (b) b.scrollIntoView({ block: "center" });
});
await new Promise(r => setTimeout(r, 4000));
console.log([...js].join("\n"));
fs.writeFileSync("C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\task-page-js.txt", [...js].join("\n"));
await page.close();
process.exit(0);