import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
const base = "https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/";

const tasks = [
  ["content", "cL7bCIHHoYj7ip2bp"],
  ["content", "Yn9vaRZeX4SsZ2ROO"],
  ["content", "3fNEIwHqrkOlP5EeU"],
  ["content", "cH1MK238rfrUOdczh"],
  ["content", "V5vmOUvFgUXhFoc73"],
  ["content", "xW504neHLGs9PGxOE"],
  ["content", "3nwsEFTLuGAN8qTO1"],
  ["content", "1KeJhJZNMJRbpsPyy"],
];

for (const [type, id] of tasks) {
  await page.goto(base + type + "/" + id, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise(r => setTimeout(r, 5000));
  const r = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
    if (!b) return "no-mark-button";
    b.scrollIntoView({ block: "center" });
    b.click();
    return "clicked";
  });
  await new Promise(r => setTimeout(r, 4000));
  const done = await page.evaluate(() => /completed/i.test(document.body.innerText));
  console.log(id, r, "-> completed:", done);
}

await page.close();
process.exit(0);