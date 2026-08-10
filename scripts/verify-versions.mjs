import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
const cargoLock = fs.readFileSync('src-tauri/Cargo.lock', 'utf8');
const cargoMatch = cargo.match(/^version\s*=\s*"([^"]+)"/m);
const cargoLockMatch = cargoLock.match(
  /\[\[package\]\]\r?\nname\s*=\s*"spark-desktop"\r?\nversion\s*=\s*"([^"]+)"/,
);

if (!cargoMatch) {
  throw new Error('Could not read the package version from src-tauri/Cargo.toml.');
}

if (!cargoLockMatch) {
  throw new Error('Could not read the package version from src-tauri/Cargo.lock.');
}

const versions = {
  packageJson: pkg.version,
  packageLock: packageLock.version,
  packageLockRoot: packageLock.packages[''].version,
  tauriConfig: tauri.version,
  cargoToml: cargoMatch[1],
  cargoLock: cargoLockMatch[1],
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
