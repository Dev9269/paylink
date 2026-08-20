import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const pages = await browser.pages();
for (const p of pages) {
  console.log("PAGE:", p.url().slice(0, 130));
}
const target = pages.find(p => /github|oauth/i.test(p.url()));
if (target) {
  console.log("GITHUB OAUTH PAGE FOUND - waiting 60s for user to authorize...");
  await new Promise(r => setTimeout(r, 60000));
  console.log("after wait:", target.url().slice(0, 130));
}
process.exit(0);