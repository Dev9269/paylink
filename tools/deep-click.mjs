import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();
const posts = [];
page.on("request", r => {
  if (r.method() === "POST" && !r.url().includes("cdn-cgi/rum")) {
    posts.push(r.url() + " :: " + (r.postData() || "").slice(0, 400));
  }
});
let task = null;
page.on("response", async r => {
  if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
    try { const j = await r.json(); if (j.data?.taskById) task = j.data.taskById; } catch {}
  }
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

const btnInfo = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (!b) return null;
  const cs = getComputedStyle(b);
  const r = b.getBoundingClientRect();
  const atTop = document.elementFromPoint(r.x + r.width / 2, r.y + 5);
  return {
    attrs: [...b.attributes].map(a => `${a.name}=${a.value}`),
    ariaDisabled: b.getAttribute("aria-disabled"),
    pointerEvents: cs.pointerEvents,
    opacity: cs.opacity,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    topEl: atTop ? (atTop.tagName + "." + (atTop.className || "").toString().slice(0, 60)) : null,
    topIsButton: atTop === b || b.contains(atTop) || atTop?.contains(b)
  };
});
console.log("BTN:", JSON.stringify(btnInfo, null, 1));

if (btnInfo) {
  posts.length = 0;
  const x = btnInfo.rect.x + btnInfo.rect.w / 2;
  const y = btnInfo.rect.y + btnInfo.rect.h / 2;
  await page.mouse.click(x, y, { count: 1 });
  await new Promise(r => setTimeout(r, 6000));
  console.log("POSTS AFTER CLICK:", posts.length ? posts.join("\n") : "(none)");
}

console.log("TASK KEYS:", task ? Object.keys(task).join(",") : "none");
if (task) {
  for (const k of ["title", "completionType", "completionRequirement", "content", "videoURL", "isEmbedTask", "embedUrl", "minCompletionTime", "requiresDiscord", "type", "taskType", "message", "isCompleted", "canComplete"]) {
    if (task[k] !== undefined) console.log(`task.${k}:`, String(task[k]).slice(0, 300));
  }
}
await page.close();
process.exit(0);