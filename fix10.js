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

  console.log('Wait 5s for CasaOS...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('CasaOS status:', await execCmd('systemctl is-active casaos-gateway'));
  console.log('Port 80:', await execCmd('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/'));
  console.log('Port 61 frontend:', await execCmd('curl -s http://127.0.0.1:61/ | head -2'));
  console.log('Port 61 API:', await execCmd('curl -s http://127.0.0.1:61/api/health'));

  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
