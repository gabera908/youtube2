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

  console.log('=== DEBUGGING API ===\n');

  console.log('1. Direct backend API:');
  console.log(await execCmd('curl -s http://127.0.0.1:3030/api/videos?limit=1'));

  console.log('\n2. Via nginx /api/videos:');
  console.log(await execCmd('curl -s http://127.0.0.1:61/api/videos?limit=1'));

  console.log('\n3. Nginx config:');
  console.log(await execCmd('cat /etc/nginx/sites-available/video-platform'));

  console.log('\n4. Check CORS headers:');
  console.log(await execCmd('curl -sI http://127.0.0.1:61/api/videos?limit=1 2>&1 | head -15'));

  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
