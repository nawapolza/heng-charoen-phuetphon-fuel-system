const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function mustExist(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) failures.push(`Missing file: ${relativePath}`);
}

function mustContain(relativePath, snippets) {
  const text = read(relativePath);
  for (const snippet of snippets) {
    if (!text.includes(snippet)) failures.push(`${relativePath} missing: ${snippet}`);
  }
}

for (const relativePath of [
  'frontend/src/pages/FuelCalculatorPage.jsx',
  'frontend/src/pages/StockStatusPage.jsx',
  'frontend/src/pages/MonthlyReportsPage.jsx',
  'MONGODB_CHANGES_V60.md',
  'RELEASE_NOTES_V60.md',
]) mustExist(relativePath);

for (const relativePath of ['package.json', 'frontend/package.json', 'backend/package.json']) {
  const data = JSON.parse(read(relativePath));
  if (data.version !== '60.0.0') failures.push(`${relativePath} version is ${data.version}, expected 60.0.0`);
}

mustContain('backend/server.js', [
  "router.get('/stocks/status', requireAuth",
  "router.get('/stocks', requireAuth, requireOwner",
  "router.post('/stocks/audit', requireAuth, requireOwner",
  "router.get('/dashboard/stats', requireAuth, requireOwner",
  "router.get('/reports/monthly', requireAuth, requireOwner",
  "db.collection('stock_audits')",
  'actual_filled_liters',
  'standard_fuel_liters',
  'fuel_variance_liters',
]);

mustContain('frontend/src/App.jsx', [
  '<FuelCalculatorPage />',
  '<StockStatusPage />',
  '<MonthlyReportsPage />',
]);

const envExample = read('backend/.env.example');
if (!envExample.includes('<username>') || !envExample.includes('<password>') || !envExample.includes('replace_with_a_long_random_secret')) {
  failures.push('backend/.env.example must contain placeholders only.');
}
if (/mongodb\+srv:\/\/[^<\s]+:[^<\s]+@/.test(envExample)) {
  failures.push('backend/.env.example appears to contain a real MongoDB credential.');
}

const syntax = spawnSync(process.execPath, ['-c', path.join(root, 'backend/server.js')], { encoding: 'utf8' });
if (syntax.status !== 0) failures.push(`Backend syntax check failed: ${syntax.stderr || syntax.stdout}`);

if (failures.length) {
  console.error('V60 verification failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('V60 verification passed: routes, pages, versions, MongoDB additions, syntax and secret cleanup are present.');
