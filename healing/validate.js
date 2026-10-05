const assert = require('node:assert/strict');

function resolveProposal(page, proposal) {
  if (proposal.method === 'label') return page.getByLabel(proposal.name, { exact: true });
  if (proposal.method === 'role') return page.getByRole(proposal.role, { name: proposal.name, exact: true });
  if (proposal.method === 'testId') return page.getByTestId(proposal.name);
  if (proposal.method === 'navigationLink') return page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: proposal.name, exact: true });
  throw new Error(`Unapproved locator method: ${proposal.method}`);
}

async function validateProposal(page, proposal, contract) {
  const locator = resolveProposal(page, proposal);
  assert.equal(await locator.count(), 1, 'Proposal must match exactly one element');
  assert.ok(await locator.isVisible(), 'Proposed element must be visible');
  assert.equal(await locator.evaluate(element => element.tagName), contract.tag);
  if (contract.initialValue) assert.equal(await locator.inputValue(), contract.initialValue, 'Input has the wrong initial value');
  if (contract.label) assert.equal(await locator.evaluate(element => Array.from(element.labels).map(label => label.textContent.trim()).join(' ')), contract.label);
  if (contract.initialText) assert.equal(await locator.innerText(), contract.initialText);
  if (contract.href) assert.equal(await locator.getAttribute('href'), contract.href);
  return locator;
}

module.exports = { resolveProposal, validateProposal };
