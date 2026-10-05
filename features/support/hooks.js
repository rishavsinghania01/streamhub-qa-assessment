const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
const { BeforeAll, AfterAll, Before, After, Status } = require('@cucumber/cucumber');
const { chromium, request } = require('@playwright/test');
const LoanPage = require('../../pages/loan.page');
const PostsClient = require('../../pages/posts.client');
const config = require('../../config/env');

let browser;
const profile = process.env.TEST_PROFILE;

BeforeAll(async function () {
  if (profile !== 'api' && profile !== 'observed') browser = await chromium.launch({ headless: config.headless });
});

Before({ tags: '@ui or @broken or @healing' }, async function () {
  this.context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await this.context.tracing.start({ screenshots: true, snapshots: true });
  this.page = await this.context.newPage();
  this.pageErrors = [];
  this.page.on('pageerror', error => this.pageErrors.push(error.message));
  this.loanPage = new LoanPage(this.page, this.config.appBaseUrl);
});

Before({ tags: '@api' }, async function () {
  this.api = await request.newContext({ baseURL: this.config.apiBaseUrl, timeout: this.config.stepTimeout });
  this.posts = new PostsClient(this.api);
});

After(async function ({ pickle, result }) {
  const caseId = createHash('sha256').update(pickle.steps.map(step => step.text).join('\n')).digest('hex').slice(0, 8);
  const name = `${profile}-${pickle.name}-${caseId}`.replace(/[^a-zA-Z0-9-]/g, '-');
  try {
    if (this.page) {
      const image = await this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
      await this.attach(image, 'image/png');
      await this.attach(JSON.stringify({ pageErrors: this.pageErrors }), 'application/json');
      await this.context.tracing.stop(result.status === Status.FAILED ? { path: `reports/traces/${name}.zip` } : {});
    }
    if (this.apiEvidence) {
      await this.attach(JSON.stringify(this.apiEvidence, null, 2), 'application/json');
      await fs.writeFile(`reports/api/${name}.json`, JSON.stringify(this.apiEvidence, null, 2));
    }
  } finally {
    if (this.context) await this.context.close();
    if (this.api) await this.api.dispose();
  }
});

AfterAll(async function () { if (browser) await browser.close(); });
