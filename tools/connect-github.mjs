import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/18OmQr65EW5ymwySp", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 12000));

const info = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button, a")].find(x => /connect github/i.test(x.innerText || ""));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { text: b.innerText.slice(0, 60), tag: b.tagName, x: r.x + r.width / 2, y: r.y + r.height / 2, inViewport: r.y > 0 && r.y < innerHeight };
});
console.log("CONNECT BTN:", JSON.stringify(info));

if (info) {
  if (!info.inViewport) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button, a")].find(x => /connect github/i.test(x.innerText || ""));
      b && b.scrollIntoView({ block: "center" });
    });
    await new Promise(r => setTimeout(r, 1000));
  }
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button, a")].find(x => /connect github/i.test(x.innerText || ""));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 8000));

  let gh = null;
  for (const p of await browser.pages()) {
    if (p.url().includes("github.com")) { gh = p; break; }
  }
  if (gh) {
    await gh.bringToFront();
    await new Promise(r => setTimeout(r, 4000));
    const s = await gh.evaluate(() => ({
      url: location.href.slice(0, 160),
      body: document.body.innerText.replace(/\s+/g, " ").slice(0, 700)
    }));
    console.log("GITHUB PAGE:", JSON.stringify(s, null, 1));
    await gh.screenshot({ path: "C:\\Users\\jaina\\AppData\\Local\\Temp\\opencode\\github-oauth.png" });
  }
}
await page.close();
process.exit(0);