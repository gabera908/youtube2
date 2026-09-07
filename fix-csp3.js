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

  // Find ALL node processes
  console.log('1. Find all node processes...');
  console.log(await execCmd('ps aux | grep node | grep -v grep'));

  // Kill ALL node processes
  console.log('\n2. Kill ALL node processes...');
  console.log(await execCmd('pkill -9 node; sleep 2; echo "killed all node"'));

  // Verify app.js content
  console.log('\n3. Verify app.js has no helmet...');
  console.log(await execCmd('grep -n helmet /root/youtube2/backend/app.js || echo "No helmet found - GOOD"'));
  console.log(await execCmd('head -15 /root/youtube2/backend/app.js'));

  // Start fresh backend
  console.log('\n4. Start fresh backend...');
  console.log(await execCmd('cd /root/youtube2 && nohup node backend/index.js > /tmp/backend.log 2>&1 &'));
  await new Promise(r => setTimeout(r, 3000));

  // Check if it started
  console.log('\n5. Check backend...');
  console.log(await execCmd('ps aux | grep "node backend" | grep -v grep'));
  console.log(await execCmd('tail -5 /tmp/backend.log'));

  // Verify no CSP
  console.log('\n6. Verify no CSP...');
  console.log(await execCmd('curl -sI http://127.0.0.1:3030/api/health 2>&1 | grep -i "content-security" || echo "NO CSP - GOOD"'));
  console.log(await execCmd('curl -sI http://127.0.0.1:61/api/health 2>&1 | grep -i "content-security" || echo "NO CSP via nginx - GOOD"'));

  console.log('\n✓ Done');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
