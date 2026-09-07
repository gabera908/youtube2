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

  // Stop CasaOS to free port 80
  console.log('1. Stop CasaOS gateway to free port 80...');
  console.log(await execCmd('systemctl stop casaos-gateway 2>/dev/null; systemctl disable casaos-gateway 2>/dev/null; echo done'));

  // Also try to find and kill any process on port 80
  console.log(await execCmd('fuser -k 80/tcp 2>/dev/null; sleep 1; echo done'));
  await new Promise(r => setTimeout(r, 2000));

  // Check port 80 is free
  console.log('2. Check port 80...');
  console.log(await execCmd('ss -tlnp | grep :80 || echo "Port 80 is free"'));

  // Update nginx config to use port 80
  console.log('3. Update nginx to port 80...');
  console.log(await execCmd(`cat > /etc/nginx/sites-available/video-platform << 'NGINXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
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

  // Remove default config
  console.log(await execCmd('rm -f /etc/nginx/sites-enabled/default'));
  console.log(await execCmd('nginx -t 2>&1'));
  console.log(await execCmd('systemctl restart nginx 2>&1'));
  await new Promise(r => setTimeout(r, 2000));
  console.log('Nginx status:', await execCmd('systemctl is-active nginx'));

  // Test port 80
  console.log('4. Test frontend on port 80...');
  console.log(await execCmd('curl -s http://127.0.0.1/ | head -3'));
  console.log('5. Test API via nginx proxy...');
  console.log(await execCmd('curl -s http://127.0.0.1/api/health'));

  // Update server .env if needed
  console.log('6. Update backend .env on server...');
  console.log(await execCmd('cat /root/youtube2/backend/.env'));

  console.log('\n✓ Done');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
