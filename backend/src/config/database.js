import dotenv from 'dotenv';
dotenv.config();

/**
 * Database Configuration
 * 
 * This file configures the connection to PostgreSQL database using Sequelize ORM.
 * Sequelize is an ORM (Object-Relational Mapping) tool that lets us interact with
 * the database using JavaScript objects instead of raw SQL queries.
 * 
 * Benefits of using Sequelize:
 * - Write JavaScript instead of SQL
 * - Automatic data validation
 * - Protection against SQL injection
 * - Easy database migrations
 */

export const dbConfig = {
  // Database connection settings
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'cbioportal_dashboard',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  
  // Sequelize-specific settings
  dialect: 'postgres', // We're using PostgreSQL
  
  // Connection pool configuration
  // A pool maintains multiple database connections for better performance
  pool: {
    max: 5,        // Maximum number of connections
    min: 0,        // Minimum number of connections
    acquire: 30000, // Maximum time (ms) to get connection
    idle: 10000    // Maximum time (ms) connection can be idle
  },
  
  // Logging configuration
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Timezone configuration
  timezone: '+00:00' // Store all dates in UTC
};

export default dbConfig;
