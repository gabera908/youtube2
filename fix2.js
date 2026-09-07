const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa'));

function execCmd(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); });
      stream.stderr.on('data', (d) => { out += d.toString(); });
      stream.on('close', () => resolve(out));
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

  // Fix backend .env
  console.log('1. Creating .env...');
  console.log(await execCmd('cd /root/youtube2/backend && printf "DB_HOST=127.0.0.1\\nDB_PORT=3306\\nDB_USER=root\\nDB_PASSWORD=rootpassword\\nDB_NAME=video_platform\\nPORT=3030\\nNODE_ENV=production\\n" > .env && cat .env'));

  // Kill old backend
  console.log('2. Killing old processes...');
  console.log(await execCmd('pkill -f "node index.js" 2>/dev/null; sleep 1; echo DONE'));

  // Start backend
  console.log('3. Starting backend...');
  console.log(await execCmd('cd /root/youtube2/backend && nohup node index.js &>/tmp/backend.log & disown; sleep 4; cat /tmp/backend.log'));

  // Test backend
  console.log('4. Testing backend API...');
  console.log(await execCmd('curl -s http://127.0.0.1:3030/api/health'));

  // Fix nginx
  console.log('5. Fixing nginx...');
  console.log(await execCmd('fuser -k 80/tcp 2>/dev/null; sleep 1; systemctl start nginx 2>&1; systemctl status nginx | head -5'));

  // Test frontend
  console.log('6. Testing frontend...');
  console.log(await execCmd('curl -s http://127.0.0.1:80 | head -5'));

  console.log('\n✓✓✓ PROJECT IS LIVE ✓✓✓');
  console.log('🌐 Frontend: http://100.84.254.18');
  console.log('🔌 Backend API: http://100.84.254.18:3030');
  
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
