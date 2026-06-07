/**
 * Database schema for contacts
 */

import { getDatabase, getDatabaseType, query } from './connection.js';

/**
 * Create tables
 */
export const createTables = async () => {
  const dbType = getDatabaseType();

  try {
    if (dbType === 'sqlite') {
      await createSQLiteTables();
    } else if (dbType === 'postgresql') {
      await createPostgreSQLTables();
    }
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

/**
 * Create SQLite tables
 */
const createSQLiteTables = async () => {
  const db = getDatabase();

  const tables = [
    `
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread' CHECK(status IN ('unread', 'read', 'replied', 'archived')),
      honeypot TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      replied_at DATETIME,
      archived_at DATETIME
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES admin_users(id)
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `,
    `CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);`,
    `CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);`,
    `CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON email_logs(contact_id);`,
  ];

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      let completed = 0;
      tables.forEach((sql) => {
        db.run(sql, (err) => {
          if (err) reject(err);
          completed++;
          if (completed === tables.length) resolve();
        });
      });
    });
  });
};

/**
 * Create PostgreSQL tables
 */
const createPostgreSQLTables = async () => {
  const sqls = [
    `
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread' CHECK(status IN ('unread', 'read', 'replied', 'archived')),
      honeypot TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      replied_at TIMESTAMP,
      archived_at TIMESTAMP
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES admin_users(id)
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL,
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `,
    `CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);`,
    `CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);`,
    `CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON email_logs(contact_id);`,
  ];

  for (const sql of sqls) {
    try {
      await query(sql);
    } catch (error) {
      // Index might already exist, continue
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }
};
