class LoanPage {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.amount = page.getByLabel('Loan amount (INR)', { exact: true });
    this.rate = page.getByLabel('Annual interest rate (%)', { exact: true });
    this.years = page.getByLabel('Loan tenure (years)', { exact: true });
    this.calculate = page.getByRole('button', { name: 'Calculate repayment', exact: true });
    this.payment = page.getByTestId('monthly-payment');
    this.interest = page.getByTestId('total-interest');
    this.total = page.getByTestId('total-repayment');
    this.chart = page.getByRole('img', { name: 'Annual principal and interest payments' });
    this.table = page.getByRole('table', { name: 'Annual repayment schedule' });
  }

  async open(view = 'dashboard') { await this.page.goto(`${this.baseUrl}/#${view}`); }

  async enterLoan(amount, rate, years) {
    await this.amount.fill(String(amount));
    await this.rate.fill(String(rate));
    await this.years.fill(String(years));
    await this.calculate.click();
  }

  async showReport() {
    await this.page.getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Repayment report', exact: true }).click();
  }
}

module.exports = LoanPage;
