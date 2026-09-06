const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'frontend');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Building frontend for production...');
ensureDir(DIST_DIR);

// Copy HTML files (minified later)
const htmlFiles = ['index.html'];
for (const file of htmlFiles) {
  const src = path.join(SRC_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST_DIR, file));
    console.log(`  Copied ${file}`);
  }
}

// Copy pages directory
const pagesDir = path.join(SRC_DIR, 'pages');
if (fs.existsSync(pagesDir)) {
  copyDir(pagesDir, path.join(DIST_DIR, 'pages'));
  console.log('  Copied pages/');
}

// Copy CSS directory
copyDir(path.join(SRC_DIR, 'css'), path.join(DIST_DIR, 'css'));
console.log('  Copied css/');

// Copy JS directory
copyDir(path.join(SRC_DIR, 'js'), path.join(DIST_DIR, 'js'));
console.log('  Copied js/');

// Copy PWA files
const pwaFiles = ['manifest.json', 'service-worker.js', 'robots.txt', 'sitemap.xml'];
for (const file of pwaFiles) {
  const src = path.join(SRC_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST_DIR, file));
    console.log(`  Copied ${file}`);
  }
}

// Copy icons directory if exists
const iconsDir = path.join(SRC_DIR, 'icons');
if (fs.existsSync(iconsDir)) {
  copyDir(iconsDir, path.join(DIST_DIR, 'icons'));
  console.log('  Copied icons/');
}

// Copy nginx config
const nginxSrc = path.join(SRC_DIR, 'nginx.conf');
if (fs.existsSync(nginxSrc)) {
  fs.copyFileSync(nginxSrc, path.join(DIST_DIR, 'nginx.conf'));
  console.log('  Copied nginx.conf');
}

console.log('\nFrontend build complete!');
console.log(`Output: ${DIST_DIR}`);
