const fs = require('fs');
const path = require('path');

const SRC_CSS = path.join(__dirname, '..', 'frontend', 'css');
const DIST_CSS = path.join(__dirname, '..', 'dist', 'css');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function minifyCSS() {
  try {
    const csso = require('csso');

    ensureDir(DIST_CSS);

    const cssFiles = fs.readdirSync(SRC_CSS).filter(f => f.endsWith('.css'));

    for (const file of cssFiles) {
      const srcPath = path.join(SRC_CSS, file);
      const distPath = path.join(DIST_CSS, file);

      const input = fs.readFileSync(srcPath, 'utf8');
      const output = csso.minify(input);

      fs.writeFileSync(distPath, output.css);
      const saved = ((1 - output.css.length / input.length) * 100).toFixed(1);
      console.log(`  Minified ${file}: ${input.length} -> ${output.css.length} bytes (${saved}% saved)`);
    }

    console.log('\nCSS minification complete!');
  } catch (err) {
    console.error('CSS minification failed:', err.message);
    process.exit(1);
  }
}

minifyCSS();
