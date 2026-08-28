import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 3000));

const cohortId = "HrDjqCAA8yxTm1yn";
const taskIds = [
  ["cL7bCIHHoYj7ip2bp", "About Program"],
  ["Yn9vaRZeX4SsZ2ROO", "Program Structure"],
  ["3fNEIwHqrkOlP5EeU", "WhatsApp"],
  ["cH1MK238rfrUOdczh", "Mechanics"],
  ["V5vmOUvFgUXhFoc73", "FAQ"],
  ["xW504neHLGs9PGxOE", "Big Picture"],
  ["3nwsEFTLuGAN8qTO1", "Judging Criteria"],
  ["1KeJhJZNMJRbpsPyy", "Consent"],
  ["GjAlhUqeNiSTvHrUh", "Opening Ceremony"],
  ["sVRKq3SyS6FN7PxAo", "Workshop 1"]
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
    try {
      const r = await fetch("https://api.risein.com/graphql", {
        method: "POST", credentials: "include",
        headers: { "content-type": "application/json" },
        body
      });
      const j = await r.json();
      out.push({
        name, taskId, status: r.status,
        errors: j.errors?.map(e => e.message) || null,
        completedTasks: j.data?.completeContentTask?.completedTasks || null
      });
    } catch (e) {
      out.push({ name, taskId, error: String(e).slice(0, 200) });
    }
    await new Promise(res => setTimeout(res, 400));
  }
  return out;
}, { cohortId, taskIds, frag });

for (const o of results) {
  if (o.errors) console.log(`${o.name}: ERR ${o.errors.join(" | ")}`);
  else console.log(`${o.name}: completedTasks=${o.completedTasks?.length ?? "null"}`);
}
await page.close();
process.exit(0);