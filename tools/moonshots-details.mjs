import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight/tasks/content/u9jeXEnqcTxHd7ftX", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 8000));

const out = await page.evaluate(async () => {
  const res = {};
  const ids = {
    l1: "MS2S3hmDXqerSvdcW",
    idea: "MvAC1yHMUnbrCBgyj",
    feedback: "zIZgEw3ubx0BNS3N1",
    prize: "B0h1574gNurMRMTH5"
  };
  for (const [k, taskId] of Object.entries(ids)) {
    const body = JSON.stringify({
      operationName: "taskById", variables: { taskId },
      query: `query taskById($taskId: NonEmptyString!) { taskById(taskId: $taskId) { _id task { _id title type description backgroundSurvey { _id title type options { _id title } } form { _id title type options { _id title } } } } }`
    });
    const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
    const j = await r.json();
    const t = j.data?.taskById?.task;
    const strip = h => (h || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    res[k] = {
      title: t?.title,
      desc: strip(t?.description).slice(0, 900),
      bgsurvey: t?.backgroundSurvey?.map(q => ({ id: q._id, title: q.title, type: q.type, options: q.options?.map(o => `${o._id}:${o.title}`) })),
      form: t?.form?.map(q => ({ id: q._id, title: q.title, type: q.type, options: q.options?.map(o => `${o._id}:${o.title}`) }))
    };
    await new Promise(s => setTimeout(s, 400));
  }
  return res;
});

console.log(JSON.stringify(out, null, 1));
await page.close();
process.exit(0);