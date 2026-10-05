import { calculateLoan } from './calculator.js';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const form = document.querySelector('#loan-form');
const error = document.querySelector('#form-error');
const chart = document.querySelector('#repayment-chart');
const svgNamespace = 'http://www.w3.org/2000/svg';

function drawChart(schedule) {
  chart.replaceChildren();
  const maxPayment = Math.max(...schedule.map(row => row.principal + row.interest));
  const slot = 780 / schedule.length;
  const width = Math.min(44, slot * 0.7);
  for (const row of schedule) {
    const x = 50 + (row.year - 1) * slot + (slot - width) / 2;
    const principalHeight = row.principal / maxPayment * 230;
    const interestHeight = row.interest / maxPayment * 230;
    for (const [kind, value, height, y] of [
      ['principal', row.principal, principalHeight, 260 - principalHeight],
      ['interest', row.interest, interestHeight, 260 - principalHeight - interestHeight],
    ]) {
      const bar = document.createElementNS(svgNamespace, 'rect');
      for (const [key, val] of Object.entries({ x, y, width, height, 'data-year': row.year, 'data-kind': kind, 'data-value': value, class: kind })) {
        bar.setAttribute(key, val);
      }
      const title = document.createElementNS(svgNamespace, 'title');
      title.textContent = `Year ${row.year} ${kind}: ${money.format(value)}`;
      bar.append(title);
      chart.append(bar);
    }
    const label = document.createElementNS(svgNamespace, 'text');
    label.setAttribute('x', x + width / 2);
    label.setAttribute('y', 284);
    label.setAttribute('text-anchor', 'middle');
    label.textContent = row.year;
    chart.append(label);
  }
}

function updateLoan() {
  const principal = form.elements.amount.valueAsNumber;
  const annualRate = form.elements.rate.valueAsNumber;
  const years = form.elements.years.valueAsNumber;
  let message = '';
  if (!Number.isInteger(principal) || principal < 1 || principal > 100000000) message = 'Enter a whole loan amount between 1 and 100,000,000 INR.';
  else if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 40) message = 'Enter an annual interest rate between 0 and 40%.';
  else if (!Number.isInteger(years) || years < 1 || years > 40) message = 'Enter a whole loan tenure between 1 and 40 years.';
  error.textContent = message;
  error.hidden = !message;
  if (message) return;

  const loan = calculateLoan(principal, annualRate, years);
  document.querySelector('[data-testid="monthly-payment"]').textContent = money.format(loan.payment);
  document.querySelector('[data-testid="total-interest"]').textContent = money.format(loan.totalInterest);
  document.querySelector('[data-testid="total-repayment"]').textContent = money.format(loan.totalRepayment);
  document.querySelector('[data-testid="payment-count"]').textContent = loan.months;
  document.querySelector('#report-description').textContent = `${money.format(principal)} at ${annualRate}% over ${years} years. Monthly payment: ${money.format(loan.payment)}.`;
  const body = document.querySelector('#schedule-body');
  body.replaceChildren();
  for (const row of loan.schedule) {
    const tr = document.createElement('tr');
    for (const value of [row.year, money.format(row.principal), money.format(row.interest), money.format(row.balance)]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    body.append(tr);
  }
  drawChart(loan.schedule);
}

function navigate() {
  const view = location.hash === '#report' ? 'report' : 'dashboard';
  for (const section of document.querySelectorAll('main > section')) section.hidden = section.id !== view;
  for (const link of document.querySelectorAll('nav a')) {
    if (link.hash === `#${view}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  updateLoan();
});
window.addEventListener('hashchange', navigate);
updateLoan();
navigate();
