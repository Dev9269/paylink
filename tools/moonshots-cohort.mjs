import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
let cohortId = null;
page.on("request", r => {
  if (r.method() === "POST" && r.url().includes("api.risein.com/graphql")) {
    const pd = r.postData() || "";
    if (pd.includes("getUserRating")) {
      const m = pd.match(/"cohortId":"([^"]+)/);
      if (m) cohortId = m[1];
    }
  }
});
await page.goto("https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/content/u9jeXEnqcTxHd7ftX", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 10000));
console.log("cohortId:", cohortId);
await page.close();
process.exit(0);