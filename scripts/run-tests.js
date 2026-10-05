const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const config = require('../config/env');

async function main() {
  const profile = process.argv[2] || 'assessment';
  const allowed = ['assessment', 'ui', 'api', 'observed', 'broken', 'healing'];
  if (!allowed.includes(profile)) throw new Error(`Unknown profile: ${profile}`);
  fs.mkdirSync('reports/screenshots', { recursive: true });
  fs.mkdirSync('reports/traces', { recursive: true });
  fs.mkdirSync('reports/api', { recursive: true });
  for (const directory of ['reports/screenshots', 'reports/traces', 'reports/api']) {
    for (const name of fs.readdirSync(directory)) {
      if (name.startsWith(`${profile}-`)) fs.unlinkSync(path.join(directory, name));
    }
  }
  process.env.TEST_PROFILE = profile;

  let server;
  if (profile !== 'api' && profile !== 'observed' && !process.env.EXTERNAL_APP) {
    server = spawn(process.execPath, ['app/server.js'], { stdio: ['ignore', 'pipe', 'inherit'] });
    server.stdout.on('data', data => process.stdout.write(data));
  }
  try {
    if (server) {
      let ready = false;
      for (let attempt = 0; attempt < 50; attempt++) {
        if (server.exitCode !== null) throw new Error(`App server exited with ${server.exitCode}`);
        try {
          const response = await fetch(config.appBaseUrl, { signal: AbortSignal.timeout(500) });
          if (response.ok) { ready = true; break; }
        } catch (error) {
          if (error.name !== 'TypeError' && error.name !== 'TimeoutError') throw error;
        }
        await delay(100);
      }
      if (!ready) throw new Error(`App did not start at ${config.appBaseUrl}`);
    }

    const cucumber = path.join('node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
    const child = spawn(process.execPath, [cucumber, '--profile', profile], { stdio: ['inherit', 'pipe', 'pipe'] });
    const log = fs.createWriteStream(`reports/${profile}.log`);
    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', data => { process.stdout.write(data); log.write(data); });
    }
    const code = await new Promise((resolve, reject) => { child.on('exit', resolve); child.on('error', reject); });
    log.end();
    process.exitCode = code;
  } finally {
    if (server && server.exitCode === null) {
      const stopped = new Promise(resolve => server.once('exit', resolve));
      server.kill('SIGTERM');
      await stopped;
    }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
