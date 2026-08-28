import puppeteer from 'puppeteer-core';

const BROWSER_URL = 'http://127.0.0.1:9222';
const PROBE_ID = process.argv[2] || 'MS2S3hmDXqerSvdcW';

const CANDIDATES = [
  'reviewComment', 'reviewHistory', 'reviewerId', 'moderationMode',
  'isCompleted', 'currentStatus', 'createdAt', 'submittedAt',
  'moderationComment', 'moderationReason', 'reviewerComment',
  'taskFeedback', 'rejectionComment', 'feedbackComment',
];

async function gql(page, query) {
  return await page.evaluate(async (query) => {
    const res = await fetch('https://api.risein.com/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query }),
    });
    return await res.json();
  }, query);
}

const browser = await puppeteer.connect({ browserURL: BROWSER_URL });
const page = await browser.newPage();
await page.goto('https://www.risein.com/dashboard', { waitUntil: 'domcontentloaded' });

console.log('== PROBE RESULT for', PROBE_ID, '==');
for (const c of CANDIDATES) {
  const query = `query{ taskById(taskId: "${PROBE_ID}"){ _id task{_id title} taskCompletion{ moderationStatus ${c} } } }`;
  const out = await gql(page, query);
  const hadData = out?.data?.taskById;
  if (hadData) {
    const tc = hadData.taskCompletion || {};
    console.log(`[OK]  ${c} =>`, JSON.stringify(tc[c]).slice(0, 800));
  } else {
    const err = (out?.errors || []).find((e) =>
      e.message.includes(`field "${c}" on type "TaskCompletion"`)
    );
    if (err) console.log(`[NO]  ${c}`);
    else console.log(`[RAW-ERR] ${c} =>`, JSON.stringify(out).slice(0, 500));
  }
}
await page.close();
await browser.disconnect();