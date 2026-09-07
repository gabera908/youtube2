const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa'));

function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: false }, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); });
      stream.stderr.on('data', (d) => { out += d.toString(); });
      stream.on('close', () => resolve(out));
      setTimeout(() => { try { stream.close(); } catch(e) {} }, 5000);
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
  console.log('✓ Connected!\n');

  console.log('1. Kill old backend...');
  console.log(await execCmd('pkill -f "node index.js" 2>/dev/null || true'));

  console.log('2. Start backend in background...');
  console.log(await execCmd('cd /root/youtube2/backend && nohup node index.js > /tmp/backend.log 2>&1 & echo "BACKEND_PID=$!"'));

  console.log('3. Wait and check backend log...');
  await new Promise(r => setTimeout(r, 5000));
  console.log(await execCmd('cat /tmp/backend.log'));

  console.log('4. Test backend API...');
  console.log(await execCmd('curl -s http://127.0.0.1:3030/api/health'));

  console.log('5. Kill anything on port 80 and start nginx...');
  console.log(await execCmd('fuser -k 80/tcp 2>/dev/null || true'));
  await new Promise(r => setTimeout(r, 2000));
  console.log(await execCmd('systemctl start nginx 2>&1 || echo "nginx start attempted"'));
  await new Promise(r => setTimeout(r, 2000));
  console.log(await execCmd('systemctl is-active nginx'));

  console.log('6. Test frontend...');
  console.log(await execCmd('curl -s http://127.0.0.1:80 | head -5'));

  console.log('\n✓✓✓ ALL DONE ✓✓✓');
  console.log('🌐 http://100.84.254.18');
  
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
