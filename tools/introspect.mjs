import puppeteer from "puppeteer-core";
const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));
const out = await page.evaluate(async () => {
  const q = (name) => `query { __type(name: "${name}") { name fields { name type { kind name ofType { kind name ofType { kind name } } } } } }`;
  const res = async (n) => fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ operationName: null, variables: {}, query: q(n) }) }).then(r => r.json());
  const tc = await res("TaskCompletion");
  const t = await res("SubmissionTask");
  return { taskCompletion: tc.data?.__type?.fields?.map(f => `${f.name}: ${f.type?.name || f.type?.ofType?.name || ""}`) || tc.errors, submissionTask: t.data?.__type?.fields?.map(f => `${f.name}: ${f.type?.name || f.type?.ofType?.name || ""}`) || t.errors };
});
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
await page.close();
process.exit(0);
