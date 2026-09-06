const fs = require('fs');
const path = require('path');

const SRC_JS = path.join(__dirname, '..', 'frontend', 'js');
const DIST_JS = path.join(__dirname, '..', 'dist', 'js');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function minifyJS() {
  try {
    const { minify } = require('terser');

    ensureDir(DIST_JS);

    const jsFiles = fs.readdirSync(SRC_JS).filter(f => f.endsWith('.js'));

    for (const file of jsFiles) {
      const srcPath = path.join(SRC_JS, file);
      const distPath = path.join(DIST_JS, file);

      const input = fs.readFileSync(srcPath, 'utf8');
      const result = await minify(input, {
        compress: {
          drop_console: false,
          drop_debugger: true,
          passes: 2
        },
        mangle: {
          safari10: true
        },
        output: {
          comments: false
        }
      });

      fs.writeFileSync(distPath, result.code);
      const saved = ((1 - result.code.length / input.length) * 100).toFixed(1);
      console.log(`  Minified ${file}: ${input.length} -> ${result.code.length} bytes (${saved}% saved)`);
    }

    console.log('\nJS minification complete!');
  } catch (err) {
    console.error('JS minification failed:', err.message);
    process.exit(1);
  }
}

minifyJS();
