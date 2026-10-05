const fs = require('node:fs');

if (fs.existsSync('.env')) process.loadEnvFile('.env');

const host = process.env.APP_HOST || '127.0.0.1';
const port = Number(process.env.APP_PORT || 4173);

module.exports = {
  host,
  port,
  appBaseUrl: process.env.APP_BASE_URL || `http://${host}:${port}`,
  apiBaseUrl: process.env.JSONPLACEHOLDER_BASE_URL || 'https://jsonplaceholder.typicode.com',
  headless: process.env.HEADLESS !== 'false',
  stepTimeout: Number(process.env.STEP_TIMEOUT_MS || 15000),
};
