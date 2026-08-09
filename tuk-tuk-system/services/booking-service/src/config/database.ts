import { Pool } from 'pg';
import logger from '../utils/logger';

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'eaa_db',
  user: process.env.DB_USER || 'eaa_user',
  password: process.env.DB_PASSWORD || 'eaa_password',
});

export const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(255) UNIQUE NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        pickup_location TEXT NOT NULL,
        dropoff_location TEXT NOT NULL,
        phone VARCHAR(50) NOT NULL,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME NOT NULL,
        notes TEXT,
        is_guest BOOLEAN DEFAULT false,
        user_id INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        estimated_price DECIMAL(10, 2),
        actual_price DECIMAL(10, 2),
        driver_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_id ON bookings(booking_id);
      CREATE INDEX IF NOT EXISTS idx_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_created_at ON bookings(created_at);
    `);
    
    logger.info('Database tables created/verified');
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  }
};

export default pool;
