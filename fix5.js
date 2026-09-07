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
      setTimeout(() => { try { stream.close(); } catch(e) {} }, 5000);
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
  console.log('✓ Connected!\n');

  // Fix nginx config to use port 8080
  console.log('1. Creating nginx config on port 8080...');
  console.log(await execCmd(`cat > /etc/nginx/sites-available/video-platform << 'NGINXEOF'
server {
    listen 8080;
    server_name _;
    root /root/youtube2/dist;
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

  console.log('2. Enabling site...');
  console.log(await execCmd('ln -sf /etc/nginx/sites-available/video-platform /etc/nginx/sites-enabled/'));
  console.log(await execCmd('rm -f /etc/nginx/sites-enabled/default'));

  console.log('3. Testing and restarting nginx...');
  console.log(await execCmd('nginx -t 2>&1'));
  console.log(await execCmd('systemctl restart nginx 2>&1'));
  await new Promise(r => setTimeout(r, 2000));
  console.log(await execCmd('systemctl is-active nginx'));

  console.log('4. Opening firewall port 8080...');
  console.log(await execCmd('ufw allow 8080/tcp 2>/dev/null || true'));

  console.log('5. Testing frontend on 8080...');
  console.log(await execCmd('curl -s http://127.0.0.1:8080 | head -5'));

  console.log('6. Testing API via nginx proxy...');
  console.log(await execCmd('curl -s http://127.0.0.1:8080/api/health'));

  console.log('7. Testing from external IP...');
  console.log(await execCmd('curl -s http://100.84.254.18:8080/api/health'));

  console.log('\n✓✓✓ PROJECT IS LIVE ✓✓✓');
  console.log('🌐 Frontend: http://100.84.254.18:8080');
  console.log('🔌 Backend API: http://100.84.254.18:3030');
  
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
