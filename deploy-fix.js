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

  // Upload fixed app.js
  const appJs = fs.readFileSync('C:\\ttt\\video-platform\\frontend\\js\\app.js', 'utf8');
  await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const s = sftp.createWriteStream('/var/www/video/js/app.js');
      s.on('close', resolve);
      s.on('error', reject);
      s.end(appJs);
    });
  });
  console.log('✓ app.js uploaded to nginx');

  // Verify the fix
  console.log('\nVerify fix:');
  console.log(await execCmd('grep -n "result.data" /var/www/video/js/app.js | head -5'));
  console.log(await execCmd('sed -n "356,360p" /var/www/video/js/app.js'));

  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
