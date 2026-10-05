const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const proposals = require('../../healing/proposals.json');
const contracts = require('../../healing/contracts');
const { validateProposal } = require('../../healing/validate');

// These four locators are intentionally broken for the assessment exercise.
const legacy = {
  'loan-amount': page => page.locator('#principal-amount'),
  'calculate': page => page.getByRole('button', { name: 'Calculate EMI', exact: true }),
  'summary': page => page.locator('.dashboard-grid > section:nth-child(2) > output'),
  'report-link': page => page.getByRole('link', { name: 'Annual report', exact: true }),
};

Then('the legacy locator {string} should find its intended element', async function (key) {
  await expect(legacy[key](this.page)).toBeVisible({ timeout: 600 });
});

When('I inspect the proposal for {string}', async function (key) {
  assert.equal(await legacy[key](this.page).count(), 0, 'Old locator unexpectedly matches; stop the review');
  this.proposalKey = key;
  this.proposal = proposals[key];
  const inventory = await this.page.locator('main').ariaSnapshot();
  await fs.mkdir('reports/healing', { recursive: true });
  await fs.writeFile(`reports/healing/${key}.txt`, inventory);
  await this.attach(JSON.stringify(this.proposal), 'application/json');
});

Then('the proposal is unique and preserves its element contract', async function () {
  this.replacement = await validateProposal(this.page, this.proposal, contracts[this.proposalKey]);
});

Then('the calculation and navigation still work', async function () {
  const paymentBefore = await this.loanPage.payment.innerText();
  const amount = this.proposalKey === 'loan-amount' ? this.replacement : this.loanPage.amount;
  const calculate = this.proposalKey === 'calculate' ? this.replacement : this.loanPage.calculate;
  await amount.fill('120000');
  await this.loanPage.rate.fill('0');
  await this.loanPage.years.fill('1');
  await calculate.click();
  const summary = this.proposalKey === 'summary' ? this.replacement : this.loanPage.payment;
  await expect(summary).toHaveText('₹10,000.00');
  assert.notEqual(await this.loanPage.payment.innerText(), paymentBefore);
  if (this.proposalKey === 'report-link') await this.replacement.click();
  else await this.loanPage.showReport();
  await expect(this.page.getByRole('heading', { name: 'Repayment report', exact: true })).toBeVisible();
  await expect(this.loanPage.table.locator('tbody tr')).toHaveCount(1);
});

Then('a loan amount proposal pointing at the interest rate is rejected', async function () {
  const wrong = { ...proposals['loan-amount'], name: 'Annual interest rate (%)' };
  await assert.rejects(validateProposal(this.page, wrong, contracts['loan-amount']), /wrong initial value/);
});
