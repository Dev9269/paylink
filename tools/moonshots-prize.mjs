import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));

const out = await page.evaluate(async () => {
  const body = JSON.stringify({
    operationName: "updateBackgroundSurveyTask",
    variables: {
      taskId: "B0h1574gNurMRMTH5",
      cohortId: "ondQ5f-kFkU3lmpE",
      answers: [{ questionId: "c2f-PdMlof", selectionIds: [], essayAnswer: "0xb85d8B3fF0E566b3e8d6DAD74E5CBAa8C362693A" }],
      isCompleted: true
    },
    query: `mutation updateBackgroundSurveyTask($taskId: NonEmptyString!, $cohortId: NonEmptyString!, $answers: [AnswerInput], $isCompleted: Boolean, $period: String) { updateBackgroundSurveyTask(taskId: $taskId, cohortId: $cohortId, answers: $answers, isCompleted: $isCompleted, period: $period) { _id taskId isCompleted moderationStatus } }`
  });
  const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
  return { status: r.status, json: await r.json() };
});

console.log(JSON.stringify(out.json, null, 1).slice(0, 700));
await page.close();
process.exit(0);