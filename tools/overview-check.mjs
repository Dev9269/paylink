import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 3000));

const out = await page.evaluate(async () => {
  const body = JSON.stringify({
    operationName: "GetUserTasksOverview",
    variables: { slug: "stellar-journey-to-mastery-monthly-builder-challenges", userId: "fMj7APEo97mPYXZ4K", page: 1, limit: 3 },
    query: `query GetUserTasksOverview($slug: String!, $userId: String!, $page: Int!, $limit: Int!) { getUserTasksOverview(slug: $slug, userId: $userId, page: $page, limit: $limit) { totalCount totalPages items { _id title type } } }`
  });
  const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
  return await r.json();
});
console.log(JSON.stringify(out, null, 1).slice(0, 2000));
await page.close();
process.exit(0);