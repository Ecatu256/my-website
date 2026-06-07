/**
 * Contact model
 * Handles database operations for contacts
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection.js';

export class Contact {
  /**
   * Create a new contact
   */
  static async create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO contacts (
        id, name, email, subject, message, status, honeypot, ip_address, user_agent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      data.name,
      data.email,
      data.subject,
      data.message,
      'unread',
      data.honeypot || null,
      data.ip_address,
      data.user_agent,
      now,
      now,
    ]);

    return this.findById(id);
  }

  /**
   * Find contact by ID
   */
  static async findById(id) {
    const sql = 'SELECT * FROM contacts WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  /**
   * Find all contacts with pagination and filtering
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM contacts WHERE 1 = 1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const contacts = await query(sql, params);
    return contacts;
  }

  /**
   * Count contacts with optional filtering
   */
  static async count(options = {}) {
    const { status = null, search = null } = options;

    let sql = 'SELECT COUNT(*) as count FROM contacts WHERE 1 = 1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const result = await query(sql, params);
    return result[0].count;
  }

  /**
   * Update contact status
   */
  static async updateStatus(id, status) {
    const now = new Date().toISOString();
    let sql = 'UPDATE contacts SET status = ?, updated_at = ?';
    const params = [status, now];

    if (status === 'replied') {
      sql += ', replied_at = ?';
      params.push(now);
    } else if (status === 'archived') {
      sql += ', archived_at = ?';
      params.push(now);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await query(sql, params);
    return this.findById(id);
  }

  /**
   * Delete contact
   */
  static async delete(id) {
    const sql = 'DELETE FROM contacts WHERE id = ?';
    await query(sql, [id]);
  }

  /**
   * Get statistics
   */
  static async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
      FROM contacts
    `;

    const result = await query(sql);
    return result[0];
  }
}
