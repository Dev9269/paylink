import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
const posts = [];
page.on("request", r => {
  if (r.method() === "POST" && !r.url().includes("cdn-cgi/rum") && !r.url().includes("clarity") && !r.url().includes("facebook")) {
    posts.push(r.url() + " :: " + (r.postData() || "").slice(0, 300));
  }
});
page.on("response", async r => {
  if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
    try { const j = await r.json(); if (j.data?.taskById) console.log("taskById tc:", JSON.stringify(j.data.taskById.taskCompletion)); } catch {}
  }
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (!b) { window.__btnState = "no-button"; return; }
  b.scrollIntoView({ block: "center" });
  window.__btnState = "found";
});
await new Promise(r => setTimeout(r, 1000));
posts.length = 0;

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (b) b.click();
});
await new Promise(r => setTimeout(r, 4000));

const ui = await page.evaluate(() => ({
  state: window.__btnState,
  hasMark: /mark as complete/i.test(document.body.innerText),
  toast: [...document.querySelectorAll("[data-slot=toast]")].map(e => e.innerText.slice(0, 150))
}));
console.log("UI:", JSON.stringify(ui));
console.log("POSTS:", posts.length ? posts.join("\n") : "(none)");

await new Promise(r => setTimeout(r, 3000));
const ui2 = await page.evaluate(() => ({ hasMark: /mark as complete/i.test(document.body.innerText), toast: [...document.querySelectorAll("[data-slot=toast]")].map(e => e.innerText.slice(0, 150)) }));
console.log("UI after wait:", JSON.stringify(ui2));
console.log("POSTS2:", posts.length ? posts.join("\n") : "(none)");
await page.close();
process.exit(0);