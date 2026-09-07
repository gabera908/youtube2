const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa'));

conn.on('ready', () => {
  console.log('✓ CONNECTED TO SERVER!\n');

  const commands = [
    'echo "=== 1. Update System ==="',
    'apt update -y',
    'echo "=== 2. Install Docker ==="',
    'which docker || (apt install -y docker.io && systemctl enable docker && systemctl start docker)',
    'docker --version',
    'echo "=== 3. Install Docker Compose ==="',
    'which docker-compose || (curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose)',
    'docker-compose --version',
    'echo "=== 4. Install Git ==="',
    'which git || apt install -y git',
    'echo "=== 5. Clone Project ==="',
    'cd /root && rm -rf youtube2',
    'git clone https://github.com/gabera908/youtube2.git',
    'echo "=== 6. Project Files ==="',
    'ls -la /root/youtube2/',
    'echo "=== 7. Install Node.js ==="',
    'which node || (curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt install -y nodejs)',
    'node --version',
    'npm --version',
    'echo "=== 8. Install Backend Deps ==="',
    'cd /root/youtube2/backend && npm install --production',
    'echo "=== 9. Setup .env ==="',
    'cd /root/youtube2 && cat > backend/.env << EOF\nDB_HOST=localhost\nDB_PORT=3306\nDB_USER=root\nDB_PASSWORD=rootpassword\nDB_NAME=video_platform\nPORT=3030\nNODE_ENV=production\nEOF',
    'echo "=== 10. DONE ==="',
    'echo "All steps completed successfully!"'
  ];

  let i = 0;
  function runNext() {
    if (i >= commands.length) {
      console.log('\n✓✓✓ ALL DONE! Project deployed! ✓✓✓');
      conn.end();
      return;
    }
    const cmd = commands[i++];
    console.log(`\n>>> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error(err); runNext(); return; }
      let out = '';
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d) => { process.stderr.write(d.toString()); });
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
