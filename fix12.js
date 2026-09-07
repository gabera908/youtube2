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

  console.log('1. Check what is on port 80...');
  console.log(await execCmd('ss -tlnp | grep :80'));

  console.log('\n2. Stop nginx from port 80 (now port 61 only)...');
  console.log(await execCmd('systemctl stop nginx 2>&1'));
  console.log(await execCmd('ss -tlnp | grep :80 || echo "Port 80 is free now"'));

  console.log('\n3. Reset CasaOS rate limiter and start...');
  console.log(await execCmd('systemctl reset-failed casaos-gateway 2>/dev/null'));
  console.log(await execCmd('systemctl daemon-reload'));
  console.log(await execCmd('systemctl start casaos-gateway 2>&1'));
  await new Promise(r => setTimeout(r, 3000));
  console.log('CasaOS status:', await execCmd('systemctl is-active casaos-gateway'));

  console.log('\n4. Start Nginx on port 61...');
  console.log(await execCmd('systemctl start nginx 2>&1'));
  await new Promise(r => setTimeout(r, 2000));
  console.log('Nginx status:', await execCmd('systemctl is-active nginx'));

  console.log('\n5. Verify ports...');
  console.log(await execCmd('ss -tlnp | grep -E ":80 |:61 |:3030 "'));

  console.log('\n6. Test CasaOS on 80...');
  console.log(await execCmd('curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1/'));

  console.log('\n7. Test Frontend on 61...');
  console.log(await execCmd('curl -s http://127.0.0.1:61/ | head -2'));

  console.log('\n8. Test API on 61...');
  console.log(await execCmd('curl -s http://127.0.0.1:61/api/health'));

  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
