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

  // Upload remaining files one at a time with delay
  const remaining = [
    'pages/channel.html',
    'pages/search.html',
    'service-worker.js',
    'manifest.json',
    'robots.txt',
    'sitemap.xml',
  ];

  for (const file of remaining) {
    const lp = path.join(local, file);
    if (fs.existsSync(lp)) {
      const rp = `/root/youtube2/frontend/${file}`;
      await execCmd(`mkdir -p ${path.dirname(rp)}`);
      await uploadFile(lp, rp);
      console.log(`✓ ${file}`);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Copy frontend to dist and deploy
  console.log('\nRebuilding dist...');
  console.log(await execCmd('rm -rf /root/youtube2/dist && cp -r /root/youtube2/frontend /root/youtube2/dist'));

  console.log('\nDeploying to /var/www/video...');
  console.log(await execCmd('rm -rf /var/www/video/* && cp -r /root/youtube2/dist/* /var/www/video/ && chmod -R 755 /var/www/video'));

  console.log('\nRestart nginx...');
  console.log(await execCmd('systemctl restart nginx'));
  await new Promise(r => setTimeout(r, 1000));

  // Verify
  console.log('\n=== VERIFICATION ===');
  console.log('api.js line 9:', await execCmd('sed -n "9p" /var/www/video/js/api.js'));
  console.log('player.js:', await execCmd('head -5 /var/www/video/js/player.js'));
  console.log('watch.html:', await execCmd('head -3 /var/www/video/pages/watch.html'));
  console.log('API:', await execCmd('curl -s http://127.0.0.1:61/api/health'));
  console.log('Videos:', await execCmd('curl -s "http://127.0.0.1:61/api/videos?limit=2" 2>&1 | head -100'));

  console.log('\n✓ Done');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
