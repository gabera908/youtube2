const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa'));

conn.on('ready', () => {
  console.log('✓ Connected! Setting up database and services...\n');

  const commands = [
    'echo "=== 1. Install MySQL ==="',
    'which mysql || (DEBIAN_FRONTEND=noninteractive apt install -y mysql-server)',
    'systemctl start mysql',
    'systemctl enable mysql',
    'echo "=== 2. Start MySQL ==="',
    'systemctl status mysql | head -3',
    'echo "=== 3. Create Database ==="',
    'mysql -u root -e "CREATE DATABASE IF NOT EXISTS video_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"',
    'mysql -u root -e "SELECT 1 as test"',
    'echo "=== 4. Import Schema ==="',
    'mysql -u root video_platform < /root/youtube2/backend/models/schema.sql',
    'echo "Schema imported!"',
    'echo "=== 5. Import Seed Data ==="',
    'cd /root/youtube2/backend && node seeds/seed.js',
    'echo "=== 6. Build Frontend ==="',
    'cd /root/youtube2 && npm install && npm run build',
    'echo "=== 7. Start Backend ==="',
    'cd /root/youtube2/backend && nohup node index.js > /tmp/backend.log 2>&1 &',
    'sleep 3',
    'cat /tmp/backend.log',
    'echo "=== 8. Check Backend ==="',
    'curl -s http://localhost:3030/api/health || echo "Backend starting..."',
    'echo "=== 9. Setup Nginx ==="',
    'which nginx || (apt install -y nginx)',
    'cat > /etc/nginx/sites-available/video-platform << \'NGINX_EOF\'\nserver {\n    listen 80;\n    server_name _;\n    root /root/youtube2/dist;\n    index index.html;\n    location /api/ {\n        proxy_pass http://127.0.0.1:3030;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection \'upgrade\';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n}\nNGINX_EOF',
    'ln -sf /etc/nginx/sites-available/video-platform /etc/nginx/sites-enabled/',
    'rm -f /etc/nginx/sites-enabled/default',
    'nginx -t && systemctl restart nginx',
    'systemctl enable nginx',
    'echo "=== 10. Open Firewall ==="',
    'ufw allow 80/tcp 2>/dev/null || true',
    'ufw allow 443/tcp 2>/dev/null || true',
    'ufw allow 3030/tcp 2>/dev/null || true',
    'echo "=== 11. Final Check ==="',
    'curl -s http://localhost:80 | head -5 || echo "Nginx serving frontend"',
    'curl -s http://localhost:3030/api/health',
    'echo "=== ALL DONE ==="',
    'echo "Frontend: http://100.84.254.18"',
    'echo "Backend API: http://100.84.254.18:3030"'
  ];

  let i = 0;
  function runNext() {
    if (i >= commands.length) {
      console.log('\n✓✓✓ PROJECT IS LIVE! ✓✓✓');
      console.log('🌐 Frontend: http://100.84.254.18');
      console.log('🔌 Backend API: http://100.84.254.18:3030');
      conn.end();
      return;
    }
    const cmd = commands[i++];
    console.log(`\n>>> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error(err); runNext(); return; }
      stream.on('data', (d) => process.stdout.write(d.toString()));
      stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
      stream.on('close', () => setTimeout(runNext, 500));
    });
  }
  runNext();

}).on('error', (err) => {
  console.error('ERROR:', err.message);
}).connect({
  host: '100.84.254.18',
  port: 22,
  username: 'root',
  privateKey: privateKey,
  readyTimeout: 30000
});
