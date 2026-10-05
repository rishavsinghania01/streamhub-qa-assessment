const assert = require('node:assert/strict');
const { Given, When, Then } = require('@cucumber/cucumber');

Given('an invalid post with {string}', function (caseName) {
  this.apiCase = caseName;
  const payload = { title: 'Boundary test', body: 'Assessment test data', userId: 1 };
  if (caseName === 'long title') payload.title = 'a'.repeat(10000);
  else if (caseName === 'special characters') payload.title = 'Unicode: 😀 中文; control: \u0000\u0001; markup: <script>alert(1)</script>';
  else if (caseName === 'missing userId') delete payload.userId;
  else throw new Error(`Unknown API case: ${caseName}`);
  this.payload = payload;
});

When('I create the post', async function () {
  this.response = await this.posts.create(this.payload);
  const rawBody = await this.response.text();
  this.apiEvidence = {
    recordedAt: new Date().toISOString(),
    method: 'POST',
    url: new URL('/posts', this.config.apiBaseUrl).href,
    case: this.apiCase,
    request: this.payload,
    status: this.response.status(),
    responseHeaders: this.response.headers(),
    responseBody: rawBody,
  };
  this.responseBody = JSON.parse(rawBody);
});

Then('the API does not have a server failure', function () {
  assert.ok(this.response.status() < 500, `Server failure: ${this.response.status()}`);
});

Then('the API rejects the post with a validation error', function () {
  const status = this.response.status();
  assert.ok(status >= 400 && status < 500, `Expected a 4xx validation response; observed ${status} for ${this.apiCase}`);
  const body = this.responseBody;
  assert.ok(body.error || body.message || body.errors, 'Expected a validation error message');
});

Then('the fake API echoes the payload with a created id', function () {
  assert.equal(this.response.status(), 201);
  assert.equal(typeof this.responseBody.id, 'number');
  const { id, ...echoed } = this.responseBody;
  assert.deepEqual(echoed, this.payload);
});
