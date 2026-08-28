import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight", { waitUntil: "domcontentloaded", timeout: 120000 });
await new Promise(r => setTimeout(r, 5000));

const cohortId = "ondQ5f-kFkU3lmpE";
const taskIds = [
  ["u9jeXEnqcTxHd7ftX", "About Program"],
  ["hzfAKDIMHuCmytilq", "Program Structure"],
  ["4sgkdYxb02ZmjlB47", "WhatsApp"],
  ["aDCOpzf19FFWLwpMF", "Mechanics"],
  ["WEGCxoscGh5uhfryC", "FAQ"],
  ["F0BHL1yq35DynAKXY", "Big Picture"],
  ["aHxjpEoIBKICt04a8", "Judging Criteria"],
  ["L6hBeGTQlHu1h1neo", "Notes for Builders"]
];

const frag = `
  fragment CohortProgressAttributes on CohortProgress {
    _id userId cohortId unblockedTasks completedTasks lastCompletedTask { _id type } lastVisitedTask { _id type } createdAt updatedAt isViewedAfterEnrollment status applicationCompleted
  }
`;
const results = await page.evaluate(async ({ cohortId, taskIds, frag }) => {
  const out = [];
  for (const [taskId, name] of taskIds) {
    const body = JSON.stringify({
      operationName: "completeContentTask",
      variables: { taskId, cohortId },
      query: `mutation completeContentTask($taskId: NonEmptyString!, $cohortId: NonEmptyString!) { completeContentTask(taskId: $taskId, cohortId: $cohortId) { ...CohortProgressAttributes } } ${frag}`
    });
    const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
    const j = await r.json();
    out.push({ name, errors: j.errors?.map(e => e.message) || null, completed: j.data?.completeContentTask?.completedTasks?.length ?? null });
    await new Promise(res => setTimeout(res, 400));
  }
  return out;
}, { cohortId, taskIds, frag });

for (const o of results) {
  if (o.errors) console.log(`${o.name}: ERR ${o.errors.join(" | ")}`);
  else console.log(`${o.name}: ok (completedTasks=${o.completed})`);
}
await page.close();
process.exit(0);