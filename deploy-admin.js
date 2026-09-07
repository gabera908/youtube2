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
      setTimeout(() => { try { stream.close(); } catch(e) {} }, 8000);
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

  // 1. Add test video via API
  console.log('1. Adding test video...');
  const addVideoCmd = `curl -s -X POST http://127.0.0.1:3030/api/videos \\
    -H "Content-Type: application/json" \\
    -d '{\"title\":\"فيديو تجريبي - اختبار المنصة\",\"video_url\":\"https://youtu.be/4HMWg4uNFQ8\",\"description\":\"هذا فيديو تجريبي للتأكد من عمل الموقع بشكل صحيح\",\"category_id\":1,\"channel_id":1}'`;
  console.log(await execCmd(addVideoCmd));

  // 2. List videos to verify
  console.log('\n2. Verify video added...');
  console.log(await execCmd('curl -s http://127.0.0.1:3030/api/videos?limit=3 | head -200'));

  // 3. Rebuild dist on server
  console.log('\n3. Rebuild dist on server...');
  console.log(await execCmd('cd /root/youtube2 && npx --yes html-minifier --collapse-whitespace --remove-comments --minify-css true frontend/index.html -o dist/index.html 2>&1'));
  
  // Copy frontend files to dist
  console.log(await execCmd('cd /root/youtube2 && cp -r frontend/css dist/css && cp -r frontend/js dist/js && cp -r frontend/pages dist/pages 2>&1'));
  console.log(await execCmd('cd /root/youtube2 && cp frontend/service-worker.js dist/ 2>/dev/null; cp frontend/manifest.json dist/ 2>/dev/null; cp frontend/robots.txt dist/ 2>/dev/null; cp frontend/sitemap.xml dist/ 2>/dev/null; echo done'));

  // Copy dist to nginx location
  console.log('\n4. Deploy to /var/www/video...');
  console.log(await execCmd('cp -r /root/youtube2/dist/* /var/www/video/ && chmod -R 755 /var/www/video && echo "Deployed!"'));

  // 5. Restart nginx
  console.log('\n5. Restart nginx...');
  console.log(await execCmd('systemctl restart nginx && echo "Nginx restarted"'));
  await new Promise(r => setTimeout(r, 2000));

  // 6. Verify frontend
  console.log('\n6. Verify frontend...');
  console.log(await execCmd('curl -s http://127.0.0.1:61/ | head -5'));
  console.log(await execCmd('curl -s http://127.0.0.1:61/pages/admin.html | head -5'));

  // 7. Verify API
  console.log('\n7. Verify API...');
  console.log(await execCmd('curl -s http://127.0.0.1:3030/api/health'));
  console.log(await execCmd('curl -s http://127.0.0.1:61/api/health'));

  console.log('\n✓✓✓ ALL DONE ✓✓✓');
  console.log('🌐 Frontend:  http://100.84.254.18:61');
  console.log('🔧 Admin:     http://100.84.254.18:61/pages/admin.html');
  console.log('🔌 API:       http://100.84.254.18:3030');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
