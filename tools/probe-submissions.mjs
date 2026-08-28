import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const ids = { l1: "18OmQr65EW5ymwySp", l2: "zLD7OI0BUvUusdOgS", l3: "qQ16Ti2J20cR75yy7" };

for (const [k, id] of Object.entries(ids)) {
  const page = await browser.newPage();
  let task = null;
  page.on("response", async r => {
    if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
      try { const j = await r.json(); if (j.data?.taskById) task = j.data.taskById; } catch {}
    }
  });
  await page.goto(`https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/${id}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await new Promise(r => setTimeout(r, 10000));
  const s = await page.evaluate(() => ({
    inputs: [...document.querySelectorAll("input,textarea,select")].map(i => `${i.tagName}:${i.type || ""}:${i.name || ""}:${(i.placeholder || i.getAttribute("aria-label") || "").slice(0, 40)}`),
    buttons: [...document.querySelectorAll("button")].map(b => (b.innerText || "").trim().slice(0, 40)).filter(Boolean).filter(x => !/sidebar|dashboard|members|invite|switch|leaderboard|expand/i.test(x)).slice(0, 15)
  }));
  console.log(`=== ${k} (${id}) ===`);
  console.log("inputs:", JSON.stringify(s.inputs));
  console.log("buttons:", JSON.stringify(s.buttons));
  if (task) {
    const t = task.task;
    console.log("taskFlags:", JSON.stringify({
      isRepositorySubmissionEnabled: t.isRepositorySubmissionEnabled,
      isTextSubmissionEnabled: t.isTextSubmissionEnabled,
      isLinkSubmissionsEnabled: t.isLinkSubmissionsEnabled,
      isFileSubmissionsEnabled: t.isFileSubmissionsEnabled,
      isLinkGithub: t.isLinkGithub, isLinkLinkedin: t.isLinkLinkedin, isLinkTwitter: t.isLinkTwitter, isLinkDiscord: t.isLinkDiscord,
      collectWallets: t.collectWallets, collectSocials: t.collectSocials,
      submissionLinks: t.submissionLinks, submissionCharLimit: t.submissionCharLimit, minTextLength: t.minTextLength,
      prerequisites: t.prerequisites, isLocked: t.isLocked, lockedUntil: t.lockedUntil,
      moderationMode: t.moderationMode
    }));
  }
  await page.close();
}
process.exit(0);