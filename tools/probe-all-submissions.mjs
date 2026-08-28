import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const ids = ["18OmQr65EW5ymwySp", "zLD7OI0BUvUusdOgS", "qQ16Ti2J20cR75yy7", "sYI3hIMW2B0LPtRTG", "cVo4VfutLLOKjKWE2", "lD86fxF5AEOJaZueA", "zQpadqFIMy56zs2CG", "kyv8jwVJynzMniLPa"];

for (const id of ids) {
  const page = await browser.newPage();
  let task = null;
  page.on("response", async r => {
    if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
      try { const j = await r.json(); if (j.data?.taskById) task = j.data.taskById; } catch {}
    }
  });
  await page.goto(`https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/submission/${id}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await new Promise(r => setTimeout(r, 9000));
  if (task) {
    const t = task.task;
    const tc = task.taskCompletion;
    console.log(`=== ${t.title} (${id}) ===`);
    console.log("flags:", JSON.stringify({ repo: t.isRepositorySubmissionEnabled, text: t.isTextSubmissionEnabled, file: t.isFileSubmissionsEnabled, link: t.isLinkSubmissionsEnabled, pr: t.isPrCommitSubmissionEnabled, video: t.isScreenAndWebcamRequired, prereq: t.prerequisites?.length, locked: t.isLocked, isOptional: t.isOptional }));
    console.log("completion:", JSON.stringify({ isCompleted: tc?.isCompleted, status: tc?.currentStatus, mod: tc?.moderationStatus, repo: tc?.repository?.html_url, desc: tc?.submissionDescription?.slice(0, 60) }));
    console.log("desc:", (t.description || "").replace(/\s+/g, " ").slice(0, 260));
  }
  await page.close();
}
process.exit(0);