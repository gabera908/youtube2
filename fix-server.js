const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa'));

conn.on('ready', () => {
  console.log('✓ Connected! Fixing issues...\n');

  const commands = [
    'echo "=== 1. Fix MySQL - Bind to 127.0.0.1 ==="',
    'sed -i "s/bind-address\\s*=\\s*127.0.0.1/bind-address = 0.0.0.0/" /etc/mysql/mysql.conf.d/mysqld.cnf',
    'systemctl restart mysql',
    'sleep 2',
    'echo "=== 2. Fix backend .env to use 127.0.0.1 ==="',
    'cd /root/youtube2/backend && sed -i "s/DB_HOST=localhost/DB_HOST=127.0.0.1/" .env',
    'cat .env',
    'echo "=== 3. Fix Seed Data - Use 127.0.0.1 ==="',
    'mysql -u root -e "SHOW DATABASES"',
    'mysql -u root video_platform -e "SHOW TABLES"',
    'echo "=== 4. Re-run Seed with correct host ==="',
    'cd /root/youtube2/backend && DB_HOST=127.0.0.1 node seeds/seed.js',
    'echo "=== 5. Kill old backend process ==="',
    'pkill -f "node index.js" || true',
    'sleep 1',
    'echo "=== 6. Start Backend ==="',
    'cd /root/youtube2/backend && nohup node index.js > /tmp/backend.log 2>&1 &',
    'sleep 3',
    'cat /tmp/backend.log',
    'echo "=== 7. Fix Nginx - Kill old process ==="',
    'systemctl stop nginx 2>/dev/null; pkill -f nginx || true',
    'sleep 1',
    'systemctl start nginx',
    'systemctl status nginx | head -5',
    'echo "=== 8. Final Test ==="',
    'curl -s http://localhost:80 | head -3',
    'curl -s http://localhost:3030/api/health',
    'echo "=== ALL FIXED ==="',
    'echo "Frontend: http://100.84.254.18"',
    'echo "Backend: http://100.84.254.18:3030"'
  ];

  let i = 0;
  function runNext() {
    if (i >= commands.length) {
      console.log('\n✓✓✓ ALL FIXED! Project is LIVE! ✓✓✓');
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
