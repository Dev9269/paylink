import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const ids = ["MS2S3hmDXqerSvdcW", "K7CxZD1QjK5zhzL8u", "msnM8wbPBJwwuX9wG", "MvAC1yHMUnbrCBgyj", "nIfMvAE5xiJxBYNZT", "HlEbQsyB7jhEs4Lj5", "PqdFt2kjm8hvIMA45", "zIZgEw3ubx0BNS3N1", "T3PuuU7LO1sWT4yjM", "B0h1574gNurMRMTH5"];

const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/content/u9jeXEnqcTxHd7ftX", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 8000));

const out = await page.evaluate(async (ids) => {
  const res = [];
  for (const taskId of ids) {
    const body = JSON.stringify({
      operationName: "taskById", variables: { taskId },
      query: `query taskById($taskId: NonEmptyString!) { taskById(taskId: $taskId) { _id task { _id title type backgroundSurvey { _id title type } form { _id title type } isRepositorySubmissionEnabled isTextSubmissionEnabled isFileSubmissionsEnabled isLinkSubmissionsEnabled isPrCommitSubmissionEnabled isScreenAndWebcamRequired prerequisites isLocked lockedUntil isSubmissionFinalProject moderationMode } } }`
    });
    const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
    const j = await r.json();
    if (j.errors) res.push({ id: taskId, errors: j.errors.map(e => e.message) });
    const t = j.data?.taskById?.task;
    res.push({
      id: taskId,
      title: t?.title?.slice(0, 45),
      type: t?.type,
      bgsurvey: t?.backgroundSurvey?.map(q => `${q.title?.slice(0, 30)}|${q.type}`) || null,
      form: t?.form?.map(q => `${q.title?.slice(0, 30)}|${q.type}`) || null,
      flags: { repo: t?.isRepositorySubmissionEnabled, text: t?.isTextSubmissionEnabled, file: t?.isFileSubmissionsEnabled, link: t?.isLinkSubmissionsEnabled, pr: t?.isPrCommitSubmissionEnabled, video: t?.isScreenAndWebcamRequired },
      prereq: t?.prerequisites || [],
      locked: t?.isLocked, finalProject: t?.isSubmissionFinalProject
    });
    await new Promise(s => setTimeout(s, 400));
  }
  return res;
}, ids);

for (const r of out) console.log(JSON.stringify(r));
await page.close();
process.exit(0);