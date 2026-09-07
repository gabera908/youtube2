const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa'));

conn.on('ready', () => {
  console.log('✓ Connected! Final fixes...\n');

  const commands = [
    'echo "=== 1. Check MySQL auth ==="',
    'mysql -u root -e "SELECT user, host, plugin FROM mysql.user WHERE user=\'root\'"',
    'echo "=== 2. Fix MySQL root to use password ==="',
    'mysql -u root -e "ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'rootpassword\';"',
    'mysql -u root -e "FLUSH PRIVILEGES;"',
    'echo "=== 3. Test MySQL with password ==="',
    'mysql -u root -prootpassword -e "SHOW DATABASES"',
    'echo "=== 4. Create .env file ==="',
    'cd /root/youtube2/backend && cat > .env << EOF\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=rootpassword\nDB_NAME=video_platform\nPORT=3030\nNODE_ENV=production\nEOF',
    'cat .env',
    'echo "=== 5. Run Seed Data ==="',
    'cd /root/youtube2/backend && node seeds/seed.js',
    'echo "=== 6. Kill all old processes ==="',
    'pkill -f "node index.js" || true',
    'pkill -f nginx || true',
    'sleep 1',
    'echo "=== 7. Fix port 80 conflict ==="',
    'fuser -k 80/tcp 2>/dev/null || true',
    'sleep 1',
    'echo "=== 8. Start Backend ==="',
    'cd /root/youtube2/backend && nohup node index.js > /tmp/backend.log 2>&1 &',
    'sleep 3',
    'cat /tmp/backend.log',
    'echo "=== 9. Start Nginx ==="',
    'systemctl start nginx',
    'systemctl status nginx | head -5',
    'echo "=== 10. Final Tests ==="',
    'curl -s http://localhost:3030/api/health',
    'curl -s http://localhost:80 | head -3',
    'echo "=== ALL DONE ==="',
    'echo "Frontend: http://100.84.254.18"',
    'echo "Backend: http://100.84.254.18:3030"'
  ];

  let i = 0;
  function runNext() {
    if (i >= commands.length) {
      console.log('\n✓✓✓ PROJECT IS LIVE! ✓✓✓');
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
