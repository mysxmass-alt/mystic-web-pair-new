const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(root, { withFileTypes: true });
const sourceFiles = [path.join(root, 'index.js'), ...files.filter((entry) => entry.isFile() && entry.name.endsWith('.js')).map((entry) => path.join(root, entry.name))];
const missing = [];
const seen = new Set();

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/require\(['"](\.\.?\/[^'"]+)['"]\)/g)) {
    const request = match[1];
    if (!request.startsWith('./commands/')) continue;
    const target = path.resolve(path.dirname(file), request);
    const candidates = [target, `${target}.js`, path.join(target, 'index.js')];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      const item = `${path.relative(root, file)} -> ${request}`;
      if (!seen.has(item)) {
        seen.add(item);
        missing.push(item);
      }
    }
  }
}

if (missing.length) {
  console.error('Missing command modules:');
  console.error(missing.join('\n'));
  process.exit(1);
}

for (const required of ['package.json', 'index.js', 'index.html', 'railway.toml']) {
  if (!fs.existsSync(path.join(root, required))) {
    console.error(`Missing production file: ${required}`);
    process.exit(1);
  }
}

console.log('Repository requirement validation passed.');
