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

async function uploadFile(localPath, remotePath) {
  const content = fs.readFileSync(localPath, 'utf8');
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const s = sftp.createWriteStream(remotePath);
      s.on('close', resolve);
      s.on('error', reject);
      s.end(content);
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
  console.log('✓ Connected\n');

  const local = 'C:\\ttt\\video-platform\\frontend';

  // Upload just the key files
  const files = [
    ['js/app.js', 'app.js'],
    ['js/api.js', 'api.js'],
    ['js/player.js', 'player.js'],
    ['service-worker.js', 'service-worker.js'],
    ['pages/watch.html', 'pages/watch.html'],
    ['index.html', 'index.html'],
  ];

  for (const [src, dest] of files) {
    const lp = path.join(local, src);
    if (fs.existsSync(lp)) {
      await uploadFile(lp, `/var/www/video/${dest}`);
      await new Promise(r => setTimeout(r, 300));
      console.log(`✓ ${src}`);
    }
  }

  // Restart nginx
  await execCmd('systemctl restart nginx');
  await new Promise(r => setTimeout(r, 1000));

  // Verify
  console.log('\nSW version:', await execCmd('head -1 /var/www/video/service-worker.js'));
  console.log('app.js fix:', await execCmd('sed -n "357p" /var/www/video/js/app.js'));

  console.log('\n✓ Done. Ctrl+Shift+R to refresh');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
