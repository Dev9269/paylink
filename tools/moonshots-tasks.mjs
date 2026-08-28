import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
await page.goto("https://www.risein.com/dashboard", { waitUntil: "domcontentloaded", timeout: 90000 });
await new Promise(r => setTimeout(r, 4000));

const out = await page.evaluate(async () => {
  const slug = "new-moon-to-full-monthly-moonshots-on-midnight";
  const body = JSON.stringify({
    operationName: "GetUserTasksOverview",
    variables: { slug, userId: "fMj7APEo97mPYXZ4K", page: 1, limit: 20 },
    query: `query GetUserTasksOverview($slug: String!, $userId: String!, $page: Int, $limit: Int) { userTasksOverview(slug: $slug, userId: $userId, page: $page, limit: $limit) { items { _id title sectionTitle status } meta { totalCount totalPages } } }`
  });
  const r = await fetch("https://api.risein.com/graphql", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body });
  const j = await r.json();
  if (j.errors) return { errors: j.errors.map(e => e.message) };
  const items = j.data?.userTasksOverview?.items;
  return { count: items?.length, items: items?.map(i => ({ id: i._id, t: i.title, s: i.status })), meta: j.data?.userTasksOverview?.meta };
});
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
await page.close();
process.exit(0);