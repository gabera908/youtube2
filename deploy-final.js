const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa'));

function execCmd(cmd) {
  return new Promise((resolve) => {
    conn.exec(cmd, { pty: false }, (err, stream) => {
      if (err) return resolve('ERROR: ' + err.message);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); });
      stream.stderr.on('data', (d) => { out += d.toString(); });
      stream.on('close', () => resolve(out));
      setTimeout(() => { try { stream.close(); } catch(e) {} }, 10000);
    });
  });
}

async function main() {
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve).on('error', reject).connect({
      host: '100.84.254.18', port: 22, username: 'root',
      privateKey, readyTimeout: 30000
    });
  });
  console.log('✓ Connected\n');

  // Push updated files from local
  console.log('1. Upload updated frontend files...');
  const localDist = 'C:\\ttt\\video-platform\\frontend';
  const files = [
    'index.html',
    'js/api.js',
    'js/admin.js',
    'pages/admin.html',
  ];

  for (const file of files) {
    const localPath = path.join(localDist, file);
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf8');
      const remotePath = `/root/youtube2/frontend/${file}`;
      const remoteDir = path.dirname(remotePath);
      await execCmd(`mkdir -p ${remoteDir}`);
      await new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);
          const stream = sftp.createWriteStream(remotePath);
          stream.on('close', resolve);
          stream.on('error', reject);
          stream.end(content);
        });
      });
      console.log(`  ✓ ${file}`);
    }
  }

  // Rebuild dist
  console.log('\n2. Rebuild dist...');
  console.log(await execCmd('cd /root/youtube2 && rm -rf dist && mkdir -p dist/pages dist/css dist/js'));

  // Minify and copy index.html
  console.log(await execCmd('cd /root/youtube2 && npx --yes html-minifier --collapse-whitespace --remove-comments --minify-css true frontend/index.html -o dist/index.html 2>&1'));

  // Copy CSS, JS, pages
  console.log(await execCmd('cd /root/youtube2 && cp frontend/css/* dist/css/ && cp frontend/js/* dist/js/ && cp frontend/pages/* dist/pages/'));
  console.log(await execCmd('cd /root/youtube2 && cp frontend/service-worker.js dist/ 2>/dev/null; cp frontend/manifest.json dist/ 2>/dev/null; cp frontend/robots.txt dist/ 2>/dev/null; cp frontend/sitemap.xml dist/ 2>/dev/null; echo done'));

  // Deploy to nginx
  console.log('\n3. Deploy to /var/www/video...');
  console.log(await execCmd('rm -rf /var/www/video/* && cp -r /root/youtube2/dist/* /var/www/video/ && chmod -R 755 /var/www/video && echo "Deployed!"'));

  // Restart nginx
  console.log('\n4. Restart nginx...');
  console.log(await execCmd('systemctl restart nginx'));
  await new Promise(r => setTimeout(r, 2000));

  // Verify
  console.log('\n5. Verify...');
  console.log('Frontend:', await execCmd('curl -s http://127.0.0.1:61/ | head -1'));
  console.log('Admin:', await execCmd('curl -s http://127.0.0.1:61/pages/admin.html | head -1'));
  console.log('API:', await execCmd('curl -s http://127.0.0.1:61/api/health'));
  console.log('Videos:', await execCmd('curl -s http://127.0.0.1:61/api/videos?limit=1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Total: {d[\'pagination\'][\'total\"]}\")" 2>/dev/null || echo "check manually"'));
  console.log('CasaOS:', await execCmd('systemctl is-active casaos-gateway'));

  console.log('\n✓✓✓ ALL DONE ✓✓✓');
  console.log('🏠 CasaOS:    http://100.84.254.18      (Port 80)');
  console.log('🌐 Frontend:  http://100.84.254.18:61   (Port 61)');
  console.log('🔧 Admin:     http://100.84.254.18:61/pages/admin.html');
  console.log('🔌 API:       http://100.84.254.18:3030');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
