import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
const cargoMatch = cargo.match(/^version\s*=\s*"([^"]+)"/m);

if (!cargoMatch) {
  throw new Error('Could not read the package version from src-tauri/Cargo.toml.');
}

const versions = {
  packageJson: pkg.version,
  tauriConfig: tauri.version,
  cargoToml: cargoMatch[1],
};

const unique = new Set(Object.values(versions));
if (unique.size !== 1) {
  console.error('Version mismatch:', versions);
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version)) {
  throw new Error(`Invalid semantic version: ${pkg.version}`);
}

console.log(`Version verified: ${pkg.version}`);
