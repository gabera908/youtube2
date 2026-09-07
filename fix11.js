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

  console.log('1. Check CasaOS service...');
  console.log(await execCmd('systemctl status casaos-gateway --no-pager -l 2>&1 | head -30'));
  console.log('\n2. Check CasaOS logs...');
  console.log(await execCmd('journalctl -u casaos-gateway --no-pager -n 20 2>&1'));
  console.log('\n3. Check if binary exists...');
  console.log(await execCmd('which casaos-gateway 2>/dev/null || find / -name casaos-gateway -type f 2>/dev/null | head -5'));

  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
