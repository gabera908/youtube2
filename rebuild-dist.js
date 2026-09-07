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
  await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const stream = sftp.createWriteStream(remotePath);
      stream.on('close', resolve);
      stream.on('error', reject);
      stream.end(content);
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

  // Upload ALL frontend files to server
  console.log('1. Uploading all frontend files...');
  const files = [
    'index.html',
    'js/api.js',
    'js/app.js',
    'js/admin.js',
    'js/player.js',
    'css/style.css',
    'pages/admin.html',
    'pages/watch.html',
    'pages/category.html',
    'pages/channel.html',
    'pages/search.html',
    'service-worker.js',
    'manifest.json',
    'robots.txt',
    'sitemap.xml',
  ];

  for (const file of files) {
    const lp = path.join(local, file);
    if (fs.existsSync(lp)) {
      const rp = `/root/youtube2/frontend/${file}`;
      const dir = path.dirname(rp);
      await execCmd(`mkdir -p ${dir}`);
      await uploadFile(lp, rp);
      console.log(`  ✓ ${file}`);
    } else {
      console.log(`  - ${file} (not found locally, skipped)`);
    }
  }

  // Rebuild dist on server from uploaded frontend
  console.log('\n2. Rebuild dist on server...');
  console.log(await execCmd('rm -rf /root/youtube2/dist'));
  console.log(await execCmd('cp -r /root/youtube2/frontend /root/youtube2/dist'));
  console.log(await execCmd('ls /root/youtube2/dist/'));
  console.log(await execCmd('ls /root/youtube2/dist/js/'));
  console.log(await execCmd('ls /root/youtube2/dist/pages/'));

  // Deploy dist to nginx
  console.log('\n3. Deploy to /var/www/video...');
  console.log(await execCmd('rm -rf /var/www/video/*'));
  console.log(await execCmd('cp -r /root/youtube2/dist/* /var/www/video/'));
  console.log(await execCmd('chmod -R 755 /var/www/video'));

  // Restart nginx
  console.log('\n4. Restart nginx...');
  console.log(await execCmd('systemctl restart nginx'));
  await new Promise(r => setTimeout(r, 1000));

  // Verify files
  console.log('\n5. Verify deployed files...');
  console.log('api.js first line:', await execCmd('head -1 /var/www/video/js/api.js'));
  console.log('api.js line 9:', await execCmd('sed -n "9p" /var/www/video/js/api.js'));
  console.log('player.js exists:', await execCmd('ls -la /var/www/video/js/player.js'));
  console.log('watch.html exists:', await execCmd('ls -la /var/www/video/pages/watch.html'));

  // Test
  console.log('\n6. Test...');
  console.log('Home:', await execCmd('curl -s http://127.0.0.1:61/ | head -1'));
  console.log('Watch:', await execCmd('curl -s http://127.0.0.1:61/pages/watch.html | head -1'));
  console.log('API:', await execCmd('curl -s http://127.0.0.1:61/api/health'));
  console.log('Videos:', await execCmd('curl -s "http://127.0.0.1:61/api/videos?limit=1" | head -50'));

  console.log('\n✓✓✓ DONE ✓✓✓');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
