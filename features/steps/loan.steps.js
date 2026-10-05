const assert = require('node:assert/strict');
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

function parseMoney(text) { return Number(text.replace(/[^0-9.-]/g, '')); }

// The app uses the closed form. This oracle solves the balance recurrence by bisection.
function expectedLoan(principal, annualRate, years) {
  const months = years * 12;
  const monthlyRate = annualRate / 1200;
  let low = principal / months;
  let high = principal * (1 + monthlyRate);
  for (let iteration = 0; iteration < 100; iteration++) {
    const payment = (low + high) / 2;
    let balance = principal;
    for (let month = 0; month < months; month++) balance = balance * (1 + monthlyRate) - payment;
    if (balance > 0) low = payment;
    else high = payment;
  }
  const payment = (low + high) / 2;
  const monthly = [];
  let balance = 0;
  for (let month = months - 1; month >= 0; month--) {
    const opening = (balance + payment) / (1 + monthlyRate);
    monthly[month] = { principal: opening - balance, interest: opening * monthlyRate, balance };
    balance = opening;
  }
  const schedule = [];
  for (let year = 1; year <= years; year++) {
    const rows = monthly.slice((year - 1) * 12, year * 12);
    schedule.push({
      year,
      principal: rows.reduce((sum, row) => sum + row.principal, 0),
      interest: rows.reduce((sum, row) => sum + row.interest, 0),
      balance: rows[11].balance,
    });
  }
  return { payment, total: payment * months, interest: payment * months - principal, schedule };
}

async function verifySummary(world) {
  const expected = expectedLoan(world.loan.amount, world.loan.rate, world.loan.years);
  for (const [locator, value] of [[world.loanPage.payment, expected.payment], [world.loanPage.interest, expected.interest], [world.loanPage.total, expected.total]]) {
    const actual = parseMoney(await locator.innerText());
    assert.ok(Number.isFinite(actual) && Math.abs(actual - value) <= 0.011, `Expected ${value}, displayed ${actual}`);
  }
  await expect(world.page.getByTestId('payment-count')).toHaveText(String(world.loan.years * 12));
}

Given('I open the loan dashboard', async function () {
  await this.loanPage.open();
  this.loan = { amount: 2500000, rate: 10, years: 10 };
  this.defaultPayment = await this.loanPage.payment.innerText();
});

Given('I open the loan dashboard on a mobile viewport', async function () {
  await this.page.setViewportSize({ width: 390, height: 844 });
  await this.loanPage.open();
});

Given('I open the repayment report directly', async function () { await this.loanPage.open('report'); });

When('I calculate a loan of {int} INR at {float} percent for {int} years', async function (amount, rate, years) {
  this.loan = { amount, rate, years };
  await this.loanPage.enterLoan(amount, rate, years);
});

When('I submit {string} INR at {string} percent for {string} years', async function (amount, rate, years) {
  await this.loanPage.enterLoan(amount, rate, years);
});

When('I open the repayment report', async function () { await this.loanPage.showReport(); });
When('I return to the dashboard', async function () {
  await this.page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard', exact: true }).click();
});

Then('the dashboard shows the default loan summary', async function () {
  await expect(this.page.getByRole('heading', { name: 'A clearer view of your loan.' })).toBeVisible();
  await verifySummary(this);
});

Then('the displayed payment and totals match the independent calculation', async function () { await verifySummary(this); });

Then('the report heading and default schedule are visible', async function () {
  await expect(this.page.getByRole('heading', { name: 'Repayment report', exact: true })).toBeVisible();
  await expect(this.loanPage.table.locator('tbody tr')).toHaveCount(10);
  await expect(this.loanPage.chart).toBeVisible();
});

Then('the annual chart and schedule contain valid data', async function () {
  await expect(this.loanPage.chart).toBeVisible();
  await expect(this.loanPage.table).toBeVisible();
  const expected = expectedLoan(this.loan.amount, this.loan.rate, this.loan.years);
  const rows = this.loanPage.table.locator('tbody tr');
  await expect(rows).toHaveCount(this.loan.years);
  const bars = this.loanPage.chart.locator('rect[data-year][data-kind]');
  await expect(bars).toHaveCount(this.loan.years * 2);

  let principalSum = 0;
  let interestSum = 0;
  for (const row of expected.schedule) {
    const tableRow = rows.filter({ has: this.page.getByRole('cell', { name: String(row.year), exact: true }) });
    const cells = await tableRow.getByRole('cell').allTextContents();
    assert.equal(cells.length, 4);
    for (const [index, value] of [[1, row.principal], [2, row.interest], [3, row.balance]]) {
      assert.ok(Math.abs(parseMoney(cells[index]) - value) <= 0.011, `Year ${row.year}, column ${index}: ${cells[index]} vs ${value}`);
    }
    for (const kind of ['principal', 'interest']) {
      const bar = bars.filter({ has: this.page.locator('title').filter({ hasText: `Year ${row.year} ${kind}:` }) });
      const value = Number(await bar.getAttribute('data-value'));
      const height = Number(await bar.getAttribute('height'));
      const width = Number(await bar.getAttribute('width'));
      assert.ok(Number.isFinite(value) && value >= 0);
      assert.ok(Number.isFinite(height) && height >= 0 && width > 0);
      assert.ok(Math.abs(value - row[kind]) <= 0.01);
      if (kind === 'principal' || this.loan.rate > 0) assert.ok(value > 0 && height > 0);
      if (kind === 'principal') principalSum += value;
      else interestSum += value;
    }
  }
  assert.ok(Math.abs(principalSum - this.loan.amount) <= 0.01);
  assert.ok(Math.abs(interestSum - expected.interest) <= 0.01);
});

Then('I see the validation message {string}', async function (message) { await expect(this.page.getByRole('alert')).toHaveText(message); });
Then('the default summary has not changed', async function () { await expect(this.loanPage.payment).toHaveText(this.defaultPayment); });
Then('there are no browser errors', function () { assert.deepEqual(this.pageErrors, []); });
Then('the page fits the viewport', async function () {
  assert.ok(await this.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
});
