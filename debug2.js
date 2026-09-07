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

  console.log('1. Check api.js on server (first 6 lines):');
  console.log(await execCmd('head -6 /var/www/video/js/api.js'));

  console.log('\n2. Check CSP headers from nginx:');
  console.log(await execCmd('curl -sI http://127.0.0.1:61/ 2>&1 | head -20'));

  console.log('\n3. Check if Tailwind loads (CSP blocks CDN scripts):');
  console.log(await execCmd('curl -sI http://127.0.0.1:61/ 2>&1 | grep -i content-security'));

  console.log('\n4. Check backend CSP:');
  console.log(await execCmd('curl -sI http://127.0.0.1:3030/api/health 2>&1 | grep -i content-security'));

  console.log('\n5. Test: fetch /api/videos from browser perspective:');
  console.log(await execCmd('curl -s http://127.0.0.1:61/api/videos?limit=1 2>&1'));

  // Check if the proxy passes through CSP headers from backend
  console.log('\n6. Full response headers from nginx /api/videos:');
  console.log(await execCmd('curl -sI http://127.0.0.1:61/api/videos?limit=1 2>&1'));

  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
