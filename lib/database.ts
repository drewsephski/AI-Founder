import { neon } from '@neondatabase/serverless';

// Use Vite environment variables for client-side access
const connectionString = import.meta.env.VITE_DATABASE_URL || '';

if (!connectionString) {
  console.warn('DATABASE_URL not configured. Database features will be disabled.');
  console.warn('Please set VITE_DATABASE_URL in your .env file for database functionality.');
}

// Configure Neon for optimal serverless performance
const sql = connectionString ? neon(connectionString, {
  fetchOptions: {
    priority: 'high',
    cache: 'no-store'
  }
}) : null;

export default sql;

// Database schema types
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SavedSession {
  id: string;
  user_id: string;
  name: string;
  timestamp: Date;
  transcript: any[];
  created_at: Date;
}

export interface UserToolUsage {
  id: string;
  user_id: string;
  tool_type: string;
  tool_name: string;
  usage_count: number;
  last_used: Date;
  created_at: Date;
  updated_at: Date;
}

// Initialize database schema
export async function initializeDatabase() {
  if (!sql) {
    console.warn('Database not initialized - missing connection string');
    return;
  }
  
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create saved_sessions table for AI Hub chat sessions
    await sql`
      CREATE TABLE IF NOT EXISTS saved_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        transcript JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create user_tool_usage table for tracking tool usage
    await sql`
      CREATE TABLE IF NOT EXISTS user_tool_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tool_type VARCHAR(100) NOT NULL,
        tool_name VARCHAR(255) NOT NULL,
        usage_count INTEGER DEFAULT 1,
        last_used TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, tool_type)
      );
    `;

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    console.warn('Database features will fallback to localStorage');
  }
}

// Helper function to check if database is available
export function isDatabaseAvailable(): boolean {
  return sql !== null;
}

// Helper function to ensure database is available
export function requireDatabase(): typeof sql {
  if (!sql) {
    throw new Error('Database not available. Please configure VITE_DATABASE_URL environment variable.');
  }
  return sql;
}