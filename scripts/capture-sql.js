const path = require('node:path');
const { pathToFileURL } = require('node:url');
require('../config/env');
const { chromium } = require('@playwright/test');

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 650 } });
    for (const name of ['round_trips', 'player_streaks']) {
      const file = path.resolve(`reports/sql/${name}.html`);
      await page.goto(pathToFileURL(file).href);
      await page.getByRole('table').waitFor({ state: 'visible' });
      await page.screenshot({ path: `reports/sql/${name}.png`, fullPage: true });
      console.log(`Saved reports/sql/${name}.png`);
    }
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
