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
      setTimeout(() => { try { stream.close(); } catch(e) {} }, 10000);
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

  // Completely rewrite app.js without helmet
  console.log('1. Rewrite backend/app.js (no helmet, no CSP)...');
  console.log(await execCmd(`cat > /root/youtube2/backend/app.js << 'APPEOF'
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const pool = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const videosRouter = require('./routes/videos');
const categoriesRouter = require('./routes/categories');
const channelsRouter = require('./routes/channels');

const app = express();

app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'Server is running', database: 'connected' });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: 'Database connection failed', error: err.message });
  }
});

app.use('/api', apiLimiter);

app.use('/api/videos', videosRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/channels', channelsRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

app.use(errorHandler);

module.exports = app;
APPEOF`));

  // Restart backend
  console.log('\n2. Restart backend...');
  console.log(await execCmd('pkill -f "node backend/index.js" 2>/dev/null; sleep 1; echo killed'));
  console.log(await execCmd('cd /root/youtube2 && nohup node backend/index.js > /tmp/backend.log 2>&1 & echo started'));
  await new Promise(r => setTimeout(r, 3000));

  // Verify no CSP
  console.log('\n3. Verify no CSP...');
  console.log(await execCmd('curl -sI http://127.0.0.1:3030/api/health 2>&1 | grep -i content-security || echo "NO CSP - GOOD"'));
  console.log(await execCmd('curl -sI http://127.0.0.1:61/api/health 2>&1 | grep -i content-security || echo "NO CSP via nginx - GOOD"'));
  console.log('Backend:', await execCmd('curl -s http://127.0.0.1:61/api/health'));

  console.log('\n✓ Done. Now hard-refresh the page with Ctrl+Shift+R');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
