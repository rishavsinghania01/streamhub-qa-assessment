# Streamhub QA assessment

This submission completes **Section A**. Loan Ledger is a small loan planner with a dashboard, input validation, an annual repayment report and a stacked principal/interest chart.

## Setup

Use Node.js 22 or newer, Python 3.10 or newer, and SQLite 3.38 or newer through Python's standard `sqlite3` module.

```sh
npm ci
npx playwright install chromium
cp .env.example .env
npm start
```

Open the `APP_BASE_URL` from `.env`. Tests read their URLs from `config/env.js`; page objects and steps contain no deployment URLs. `HEADLESS=false` shows the test browser. If testing an already running app, set `EXTERNAL_APP=true`; otherwise the runner starts and stops the local server. Keep `APP_BASE_URL`, `APP_HOST` and `APP_PORT` consistent when changing ports.

## Run the tests

```sh
npm run test:ui
npm run test:api
npm run test:api:observed
npm run test:sql
npm run report:sql
npm run test:broken
npm run test:healing
npm run report:summary
```

`npm test` runs the UI scenarios and the requested API rejection checks together. It exits with code 1 while JSONPlaceholder accepts the invalid posts. The intentionally broken locator scenarios run only through `test:broken`, which also exits with code 1.

## Execution results

These results come from executed tests. See [the machine-readable summary](reports/summary.json) for runtime versions and counts, and [the report index](reports/index.html) for HTML reports and SQL screenshots.

| Suite | Result | Evidence |
| --- | --- | --- |
| Loan UI | 18 passed | [HTML](reports/ui.html), [log](reports/ui.log) |
| API rejection contract | 3 failed: each returned 201 | [HTML](reports/api.html), [log](reports/api.log), [request/response records](reports/api/) |
| API observed behavior | 3 passed | [HTML](reports/observed.html), [log](reports/observed.log) |
| SQL | 12 checks passed | [log](reports/sql/execution.log), [round trips](reports/sql/round_trips.png), [player streaks](reports/sql/player_streaks.png) |
| Broken locator exercise | 4 failed as intended | [HTML](reports/broken.html), [traces](reports/traces/) |
| Healing validation POC | 5 passed | [HTML](reports/healing.html), [captured accessibility trees](reports/healing/) |

### API finding

The three negative payloads use a 10,000-character title, Unicode/control characters and markup, and an omitted `userId`. JSONPlaceholder returned `201 Created` and echoed each payload. No server failure occurred, but the rejection requirement was not met.

The service does not document a maximum title length, required `userId` validation, or an unsupported character set. Unicode and escaped control characters are valid JSON; their inclusion alone does not establish an invalid API payload. The contract suite keeps the assessment's expected rejection visible. A separate characterization suite records the fake service's actual behavior. There is no mock or interception of those live requests. See [API findings](docs/api-findings.md).

## Structure and test choices

```text
app/                  Node static server and browser app
config/               Environment configuration
features/             Gherkin scenarios, steps and Cucumber lifecycle
pages/                Loan page object and API request client
healing/              Reviewed locator proposals and independent element contracts
sql/                  Schema, synthetic fixtures, queries and executable checks
scripts/              Test runner, SQL screenshots and result summary
reports/              Committed execution evidence
```

The app has no runtime dependencies. Browser contexts are fresh for each UI scenario; API contexts are isolated and disposed after each scenario. Cucumber hooks attach screenshots, browser errors and request/response evidence. Failed browser scenarios also retain a Playwright trace. Scenario content hashes prevent outline examples from overwriting each other's evidence. Each rerun replaces that profile's previous artifacts.

Working locators use labels, roles, text and test IDs. Table rows are identified by their year cell; chart bars are identified by their year and payment component. The four intentionally broken locators are isolated in `features/steps/locators.steps.js` and remain broken.

The app calculates payment from an annuity formula and outstanding balances from discounted remaining payments. The test oracle does not import app code: it solves the monthly balance recurrence by bisection and reconstructs the schedule backwards from a zero terminal balance. Payment, totals and annual rows are checked within 1.1 paise, allowing displayed rounding. Chart values are checked against that independent schedule, with positive dimensions and conservation of principal. Zero interest is supported, so an interest segment may correctly have zero height.

Coverage includes dashboard and direct report navigation, changed inputs, zero and near-zero rates, minimum/maximum inputs, invalid values, unchanged results after a rejected form, and a narrow viewport. The annual table scrolls horizontally on small screens. Loan state is held in memory and resets on reload. The app is an estimate at a fixed rate; it excludes lender-specific fees, taxes and rounding rules.

## SQL assumptions

The fixtures are synthetic IPL-style and transfer data. Player names and scores are not claims about real IPL performances.

Amounts are stored as integer cents. A returned amount must be between 90% and 110% of the original amount, inclusive, in the same currency. The return must follow the outgoing transfer within 24 hours, inclusive. For equal timestamps, ID order makes a pair deterministic. The query returns every qualifying chronological pair; it does not claim fraud or allocate each transfer to a single match.

A scoring streak means consecutive matches **played by that player** in the 2024 season. A missed team match is not an appearance; a recorded zero-run innings breaks the streak. If consecutive team fixtures are intended instead, a team roster/fixture model would be needed. Each maximal streak of at least three innings is returned once, with its start date and length. A fourth qualifying innings extends the same streak.

The runner compares exact expected rows and tests the 10%/24-hour boundaries, currencies, simultaneous timestamps, zero/29/30-run cases, multiple streaks, season exclusion and a score mutation that breaks a streak. It executes SQL in memory and exports the resulting tables before the mutation checks. [Schema](sql/schema.sql), [fixtures](sql/fixtures.sql), [round-trip query](sql/round_trips.sql), [streak query](sql/player_streaks.sql).

## AI pair-programming reflection

This project was built with OpenAI Codex. It was used to scaffold the application and framework, write and revise scenarios, investigate failing runs, and develop the locator-validation POC and SQL queries. No Claude Code session was used.

The useful parts were turning the requirements into runnable scenarios, separating the app's calculation from its test oracle, and checking failures against actual responses. The first SQL draft used `returning` as an alias, which is reserved in SQLite; execution caught that and it was changed to `incoming`. A boundary UI scenario found about nine paise of drift in an early monthly balance implementation at the maximum rate/tenure. Discounted remaining payments removed that drift. The initial report naming also overwrote scenario-outline evidence; names now include a hash of the resolved steps.

The AI did not supply a reliable API contract for JSONPlaceholder, and generated code still needed execution and review. The requested negative API checks remain red with the observed responses attached. The locator POC uses saved, reviewed proposals; it does not claim to call a model at runtime or silently repair tests. See [self-healing notes](docs/self-healing.md).

## References

- [Playwright APIRequestContext](https://playwright.dev/docs/api/class-apirequestcontext)
- [Playwright locators](https://playwright.dev/docs/locators)
- [Cucumber.js configuration](https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md)
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/)
- [SQLite window functions](https://www.sqlite.org/windowfunctions.html)
