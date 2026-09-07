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
  console.log('✓ Connected\n');

  // 1. Fix helmet CSP in backend app.js
  console.log('1. Fix CSP in backend...');
  console.log(await execCmd(`cd /root/youtube2 && cat > backend/app.js << 'APPEOF'
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

app.use((req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Content-Type-Options');
  next();
});

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

  // 2. Fix nginx config with cache-busting
  console.log('\n2. Fix nginx config (no-cache for JS/CSS)...');
  console.log(await execCmd(`cat > /etc/nginx/sites-available/video-platform << 'NGINXEOF'
server {
    listen 61;
    server_name _;
    root /var/www/video;
    index index.html;

    add_header Cache-Control "no-cache, must-revalidate";

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css)$ {
        add_header Cache-Control "no-cache, must-revalidate";
        try_files $uri =404;
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
        proxy_set_header Cache-Control "no-cache";
    }
}
NGINXEOF`));

  console.log(await execCmd('nginx -t 2>&1'));
  console.log(await execCmd('systemctl restart nginx'));

  // 3. Restart backend
  console.log('\n3. Restart backend...');
  console.log(await execCmd('pkill -f "node backend/index.js" 2>/dev/null; sleep 1'));
  console.log(await execCmd('cd /root/youtube2 && nohup node backend/index.js > /tmp/backend.log 2>&1 &'));
  await new Promise(r => setTimeout(r, 3000));

  // 4. Verify
  console.log('\n4. Verify...');
  console.log('Backend:', await execCmd('curl -s http://127.0.0.1:3030/api/health'));
  console.log('API via nginx:', await execCmd('curl -s http://127.0.0.1:61/api/health'));
  console.log('Videos:', await execCmd('curl -s "http://127.0.0.1:61/api/videos?limit=1" | head -100'));
  console.log('No CSP header:', await execCmd('curl -sI http://127.0.0.1:61/api/health 2>&1 | grep -i content-security || echo "NO CSP - GOOD"'));
  console.log('Cache header:', await execCmd('curl -sI http://127.0.0.1:61/js/api.js 2>&1 | grep -i cache-control'));

  console.log('\n✓✓✓ DONE ✓✓✓');
  conn.end();
}

main().catch(e => console.error('ERROR:', e.message));
