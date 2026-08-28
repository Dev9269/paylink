import puppeteer from "puppeteer-core";
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const urls = [
  "https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight",
  "https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks",
  "https://www.risein.com/dashboard"
];
for (const url of urls) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    const text = await page.evaluate(() => {
      const body = document.body.innerText || "";
      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      const hits = lines.filter(l => /revision|reject|feedback|remark|comment|need/i.test(l));
      return { url: location.href, hits: hits.slice(0, 40) };
    });
    console.log("=== " + url + " (" + text.url + ") ===");
    console.log(text.hits.join("\n"));
  } catch (e) { console.log("ERR " + url + ": " + e.message); }
}
await page.close();
process.exit(0);
