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

  // Check MySQL status
  console.log('1. MySQL status...');
  console.log(await execCmd('systemctl is-active mysql'));
  console.log(await execCmd('mysql -u root -prootpassword -e "SELECT 1" 2>&1 | head -5'));

  // Check backend .env
  console.log('\n2. Backend .env:');
  console.log(await execCmd('cat /root/youtube2/backend/.env'));

  // Fix DB_HOST to 127.0.0.1
  console.log('\n3. Fix DB_HOST...');
  console.log(await execCmd(`sed -i 's/DB_HOST=.*/DB_HOST=127.0.0.1/' /root/youtube2/backend/.env`));
  console.log(await execCmd(`sed -i 's/DB_PORT=.*/DB_PORT=3306/' /root/youtube2/backend/.env`));
  console.log(await execCmd(`sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=rootpassword/' /root/youtube2/backend/.env`));
  console.log(await execCmd('cat /root/youtube2/backend/.env'));

  // Restart backend
  console.log('\n4. Kill and restart backend...');
  console.log(await execCmd('pkill -9 -f "node index.js" 2>/dev/null; sleep 1'));
  console.log(await execCmd('cd /root/youtube2/backend && nohup node index.js > /tmp/backend.log 2>&1 &'));
  await new Promise(r => setTimeout(r, 3000));
  console.log(await execCmd('tail -5 /tmp/backend.log'));

  // Verify
  console.log('\n5. Verify...');
  console.log(await execCmd('curl -s http://127.0.0.1:3030/api/health'));
  console.log(await execCmd('curl -s http://127.0.0.1:61/api/health'));
  console.log(await execCmd('curl -s "http://127.0.0.1:61/api/videos?limit=1" | head -200'));

  console.log('\n✓ Done');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
