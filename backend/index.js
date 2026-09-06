require('dotenv').config();

const pool = require('./config/database');
const app = require('./app');

const PORT = parseInt(process.env.PORT, 10) || 3000;

async function start() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
}

start();
