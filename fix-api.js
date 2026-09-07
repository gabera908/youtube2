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

  const localDist = 'C:\\ttt\\video-platform\\frontend';

  // Upload fixed api.js
  console.log('1. Upload fixed api.js...');
  const apiContent = fs.readFileSync(path.join(localDist, 'js/api.js'), 'utf8');
  await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const stream = sftp.createWriteStream('/root/youtube2/frontend/js/api.js');
      stream.on('close', resolve);
      stream.on('error', reject);
      stream.end(apiContent);
    });
  });
  console.log('  ✓ api.js uploaded');

  // Copy to dist
  console.log('\n2. Copy to dist...');
  console.log(await execCmd('cp /root/youtube2/frontend/js/api.js /var/www/video/js/api.js && echo done'));

  // Restart nginx
  console.log('\n3. Restart nginx...');
  console.log(await execCmd('systemctl restart nginx'));
  await new Promise(r => setTimeout(r, 1000));

  // Verify
  console.log('\n4. Verify api.js...');
  console.log(await execCmd('head -5 /var/www/video/js/api.js'));

  console.log('\n✓ Done');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
