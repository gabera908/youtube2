const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'frontend');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function minifyHTML() {
  try {
    const { minify } = require('html-minifier');

    ensureDir(DIST_DIR);

    const htmlFiles = ['index.html'];
    const pagesFiles = ['watch.html', 'category.html', 'channel.html', 'search.html'];

    for (const file of htmlFiles) {
      const srcPath = path.join(SRC_DIR, file);
      const distPath = path.join(DIST_DIR, file);

      if (!fs.existsSync(srcPath)) continue;

      const input = fs.readFileSync(srcPath, 'utf8');
      const output = minify(input, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        minifyCSS: true,
        minifyJS: true
      });

      fs.writeFileSync(distPath, output);
      const saved = ((1 - output.length / input.length) * 100).toFixed(1);
      console.log(`  Minified ${file}: ${input.length} -> ${output.length} bytes (${saved}% saved)`);
    }

    // Minify pages directory
    const pagesDir = path.join(DIST_DIR, 'pages');
    if (fs.existsSync(pagesDir)) {
      for (const file of pagesFiles) {
        const srcPath = path.join(pagesDir, file);
        if (!fs.existsSync(srcPath)) continue;

        const input = fs.readFileSync(srcPath, 'utf8');
        const output = minify(input, {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          minifyCSS: true,
          minifyJS: true
        });

        fs.writeFileSync(srcPath, output);
        const saved = ((1 - output.length / input.length) * 100).toFixed(1);
        console.log(`  Minified pages/${file}: ${input.length} -> ${output.length} bytes (${saved}% saved)`);
      }
    }

    console.log('\nHTML minification complete!');
  } catch (err) {
    console.error('HTML minification failed:', err.message);
    process.exit(1);
  }
}

minifyHTML();
