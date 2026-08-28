import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 3000));
const res = await page.evaluate(async () => {
  const r = await fetch("https://api.risein.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      operationName: "GetUserTasksOverview",
      variables: { slug: "stellar-journey-to-mastery-monthly-builder-challenges", userId: "fMj7APEo97mPYXZ4K", page: 1, limit: 20 },
      query: "query GetUserTasksOverview($slug: String!, $userId: String!, $page: Int, $limit: Int) { userTasksOverview(slug: $slug, userId: $userId, page: $page, limit: $limit) { items { _id title sectionTitle status } meta { totalCount totalPages } } }",
    }),
  });
  return await r.json();
});
const items = res.data && res.data.userTasksOverview && res.data.userTasksOverview.items;
if (!items) { console.log("RAW:", JSON.stringify(res).slice(0, 600)); process.exit(0); }
for (const it of items) console.log(String(it.status).padEnd(12), it._id, it.title.slice(0, 55));
console.log("pages:", JSON.stringify(res.data.userTasksOverview.meta));
process.exit(0);