import puppeteer from 'puppeteer-core';

const BROWSER_URL = 'http://127.0.0.1:9222';
const TASKS = process.argv.slice(2);
const MODE = TASKS[0] === '--probe' ? 'probe' : 'dump';
const IDS = MODE === 'probe' ? [TASKS[1]] : TASKS;

const SUBFIELDS = ['__typename', 'reviewedAt', 'createdAt', 'reviewComment', 'reviewer', 'reviewerId', 'status', 'comment', 'feedback', 'summary', 'revision'];

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

const KNOWN = MODE === 'probe' ? {} : { __typename: 1, reviewedAt: 1, createdAt: 1, reviewComment: 1, reviewerId: 1, status: 1 };

for (const id of IDS) {
  console.log('\n===== ', id, '=====');
  if (MODE === 'probe') {
    for (const f of SUBFIELDS) {
      const query = `query{ taskById(taskId: "${id}"){ _id task{_id title} taskCompletion{ reviewHistory { ${f} } } } }`;
      const out = await gql(page, query);
      const val = out?.data?.taskById?.taskCompletion?.reviewHistory;
      if (out.errors?.length) {
        const err = out.errors[0].message;
        if (err.includes(`session_hist`)) continue;
        if (err.includes('Cannot query field') && !err.includes(`field "${f}"`)) {
          console.log(`[maybe] ${f} => ${err.slice(0, 180)}`);
        } else if (err.includes(`field "${f}" on type`)) {
          console.log(`[NO] ${f}`);
        } else {
          console.log(`[RAW-ERR] ${f} => ${err.slice(0, 200)}`);
        }
      } else {
        console.log(`[OK] ${f} =>`, JSON.stringify(val).slice(0, 600));
      }
    }
  } else {
    const query = `query{ taskById(taskId: "${id}"){ _id task{ _id title } taskCompletion{ moderationStatus isCompleted reviewComment reviewHistory { createdAt reviewComment reviewerId status } } } }`;
    const out = await gql(page, query);
    if (out.errors) console.log('ERRORS:', JSON.stringify(out.errors).slice(0, 900));
    const tc = out?.data?.taskById?.taskCompletion;
    const t = out?.data?.taskById?.task;
    console.log('task:', JSON.stringify(t));
    console.log('status:', tc?.moderationStatus, 'isCompleted:', tc?.isCompleted);
    console.log('latest reviewComment:', (tc?.reviewComment || '').slice(0, 1500));
    console.log('history:', JSON.stringify(tc?.reviewHistory, null, 2).slice(0, 4000));
  }
}
await page.close();
await browser.disconnect();