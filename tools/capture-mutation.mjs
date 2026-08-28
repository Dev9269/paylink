import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const page = await browser.newPage();

let taskRes = null;
page.on("response", async r => {
  if (r.url().includes("api.risein.com/graphql") && r.request().method() === "POST") {
    try {
      const j = await r.json();
      if (j.data && j.data.taskById) taskRes = j.data.taskById;
    } catch {}
  }
});

await page.goto("https://www.risein.com/programs/stellar-journey-to-mastery-monthly-builder-challenges/tasks/content/cL7bCIHHoYj7ip2bp", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise(r => setTimeout(r, 5000));

const info = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(x => /mark as complete/i.test(x.innerText || ""));
  if (!b) return "no button";
  const rect = b.getBoundingClientRect();
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
});
if (info !== "no button") {
  taskRes = null;
  await page.mouse.click(info.x, info.y);
  await new Promise(r => setTimeout(r, 6000));
}

if (taskRes) {
  console.log("taskCompletion:", JSON.stringify(taskRes.taskCompletion));
  console.log("isEmbedTaskJustCompleted:", taskRes.isEmbedTaskJustCompleted);
  console.log("redirectTaskUrl:", taskRes.redirectTaskUrl);
  console.log("message:", taskRes.message);
  console.log("isEliminated:", taskRes.isEliminated);
} else {
  console.log("no taskById response captured");
}
await page.close();
process.exit(0);