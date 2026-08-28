import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));
const out = await page.evaluate(async () => {
  const ids = ["18OmQr65EW5ymwySp", "zLD7OI0BUvUusdOgS", "qQ16Ti2J20cR75yy7", "5CekiI6OPdYcruSUu", "GVcSgGTy0xxCw07lp"];
  const res = [];
  for (const taskId of ids) {
    const body = JSON.stringify({
      operationName: "taskById", variables: { taskId },
      query: `query taskById($taskId: NonEmptyString!) { taskById(taskId: $taskId) { _id task { _id title } taskCompletion { _id isCompleted currentStatus moderationStatus repository { name html_url } submissionDescription } } }`
    });
    const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
    const j = await r.json();
    const tc = j.data?.taskById?.taskCompletion;
    res.push({ taskId, title: j.data?.taskById?.task?.title, isCompleted: tc?.isCompleted, status: tc?.currentStatus, mod: tc?.moderationStatus, repo: tc?.repository?.html_url, descLen: (tc?.submissionDescription || "").length });
  }
  return res;
});
console.log(JSON.stringify(out, null, 1));
await page.close();
process.exit(0);