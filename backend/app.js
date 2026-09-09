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
const playlistsRouter = require('./routes/playlists');

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
app.use('/api/playlists', playlistsRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

app.use(errorHandler);

module.exports = app;
