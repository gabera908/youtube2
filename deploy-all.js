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
      setTimeout(() => { try { stream.close(); } catch(e) {} }, 15000);
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
  const files = [
    'index.html', 'js/api.js', 'js/app.js', 'js/player.js', 'js/admin.js',
    'css/style.css', 'pages/admin.html', 'pages/watch.html',
    'pages/category.html', 'pages/channel.html', 'pages/search.html',
    'service-worker.js', 'manifest.json',
  ];

  for (const file of files) {
    const lp = path.join(local, file);
    if (fs.existsSync(lp)) {
      await uploadFile(lp, `/var/www/video/${file}`);
      await uploadFile(lp, `/root/youtube2/frontend/${file}`);
    }
  }
  console.log('✓ All files uploaded');

  // Restart nginx
  console.log('\nRestart nginx...');
  console.log(await execCmd('systemctl restart nginx'));

  // Verify
  console.log('\nVerify:');
  console.log('service-worker:', await execCmd('head -2 /var/www/video/service-worker.js'));
  console.log('app.js line 357:', await execCmd('sed -n "357p" /var/www/video/js/app.js'));

  console.log('\n✓ Done - Hard refresh with Ctrl+Shift+R');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
