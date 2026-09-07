const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa'));

conn.on('ready', () => {
  console.log('✓ Connected! Checking status...\n');

  const commands = [
    'pkill -f "node index.js" 2>/dev/null; sleep 1',
    'cd /root/youtube2/backend && DB_HOST=127.0.0.1 DB_PASSWORD=rootpassword PORT=3030 nohup node index.js > /tmp/backend.log 2>&1 &',
    'sleep 4',
    'cat /tmp/backend.log',
    'curl -s http://localhost:3030/api/health',
    'echo "=== NGINX ==="',
    'fuser -k 80/tcp 2>/dev/null || true',
    'sleep 1',
    'systemctl start nginx',
    'sleep 2',
    'curl -s http://localhost:80 | head -5',
    'echo "=== DONE ==="'
  ];

  let i = 0;
  function runNext() {
    if (i >= commands.length) {
      console.log('\n✓✓✓ CHECK COMPLETE ✓✓✓');
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
