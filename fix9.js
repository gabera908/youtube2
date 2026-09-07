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
  console.log('✓ Connected\n');

  // 1. Restore CasaOS
  console.log('1. Restore CasaOS gateway to port 80...');
  console.log(await execCmd('systemctl enable casaos-gateway 2>/dev/null; systemctl start casaos-gateway 2>/dev/null; echo done'));
  await new Promise(r => setTimeout(r, 2000));
  console.log('CasaOS status:', await execCmd('systemctl is-active casaos-gateway'));

  // 2. Update Nginx to port 61
  console.log('\n2. Update Nginx to port 61...');
  console.log(await execCmd(`cat > /etc/nginx/sites-available/video-platform << 'NGINXEOF'
server {
    listen 61;
    server_name _;
    root /var/www/video;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF`));

  console.log(await execCmd('rm -f /etc/nginx/sites-enabled/default'));
  console.log(await execCmd('nginx -t 2>&1'));
  console.log(await execCmd('systemctl restart nginx 2>&1'));
  await new Promise(r => setTimeout(r, 2000));
  console.log('Nginx status:', await execCmd('systemctl is-active nginx'));

  // 3. Open firewall
  console.log('\n3. Open port 61 on firewall...');
  console.log(await execCmd('ufw allow 61/tcp 2>/dev/null || true'));

  // 4. Verify everything
  console.log('\n4. Verify CasaOS on port 80...');
  console.log(await execCmd('curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/'));

  console.log('\n5. Verify Frontend on port 61...');
  console.log(await execCmd('curl -s http://127.0.0.1:61/ | head -3'));

  console.log('\n6. Verify API via Nginx proxy...');
  console.log(await execCmd('curl -s http://127.0.0.1:61/api/health'));

  console.log('\n7. Verify Backend direct...');
  console.log(await execCmd('curl -s http://127.0.0.1:3030/api/health'));

  console.log('\n8. Check all ports...');
  console.log(await execCmd('ss -tlnp | grep -E ":80 |:61 |:3030 "'));
  console.log(await execCmd('systemctl is-active casaos-gateway'));

  console.log('\n✓✓✓ DONE ✓✓✓');
  console.log('🏠 CasaOS:    http://100.84.254.18 (Port 80)');
  console.log('🌐 Frontend:  http://100.84.254.18:61');
  console.log('🔌 Backend:   http://100.84.254.18:3030');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
