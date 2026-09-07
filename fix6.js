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

  console.log('1. Fix permissions on dist...');
  console.log(await execCmd('chmod -R 755 /root/youtube2/dist'));
  console.log(await execCmd('ls -la /root/youtube2/dist'));

  console.log('2. Check nginx error log...');
  console.log(await execCmd('tail -5 /var/log/nginx/error.log'));

  console.log('3. Test frontend again...');
  console.log(await execCmd('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/'));

  console.log('4. Restart nginx...');
  console.log(await execCmd('systemctl restart nginx'));
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('5. Final test...');
  console.log(await execCmd('curl -s http://100.84.254.18:8080/ | head -5'));

  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
