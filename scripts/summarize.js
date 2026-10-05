const fs = require('node:fs');
const os = require('node:os');

const profiles = ['ui', 'api', 'observed', 'broken', 'healing', 'assessment'];
const results = {};
for (const profile of profiles) {
  const filename = `reports/${profile}.json`;
  if (!fs.existsSync(filename)) continue;
  const features = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const statuses = features.flatMap(feature => feature.elements).map(scenario => {
    const steps = [...(scenario.before || []), ...scenario.steps, ...(scenario.after || [])];
    if (steps.some(step => step.result.status === 'failed')) return 'failed';
    if (steps.every(step => step.result.status === 'passed')) return 'passed';
    return 'incomplete';
  });
  results[profile] = { total: statuses.length, passed: statuses.filter(s => s === 'passed').length, failed: statuses.filter(s => s === 'failed').length, incomplete: statuses.filter(s => s === 'incomplete').length };
}
const sql = JSON.parse(fs.readFileSync('reports/sql/results.json', 'utf8'));
const summary = {
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: os.platform(), architecture: os.arch(), playwright: require('@playwright/test/package.json').version, cucumber: require('@cucumber/cucumber/package.json').version, sqlite: sql.sqlite_version },
  results,
  sql: { status: sql.status, checks: sql.checks.length, roundTripRows: sql.round_trip_rows, streakRows: sql.streak_rows },
};
fs.writeFileSync('reports/summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
