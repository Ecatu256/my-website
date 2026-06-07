/**
 * Email log model
 * Tracks email sending attempts
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection.js';

export class EmailLog {
  /**
   * Create email log entry
   */
  static async create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const sql = `
      INSERT INTO email_logs (
        id, contact_id, type, recipient, subject, status, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      data.contact_id,
      data.type,
      data.recipient,
      data.subject,
      'pending',
      null,
      now,
    ]);

    return id;
  }

  /**
   * Update email status
   */
  static async updateStatus(id, status, errorMessage = null) {
    const now = new Date().toISOString();
    let sql = 'UPDATE email_logs SET status = ?';
    const params = [status];

    if (status === 'sent') {
      sql += ', sent_at = ?';
      params.push(now);
    }

    if (errorMessage) {
      sql += ', error_message = ?';
      params.push(errorMessage);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    await query(sql, params);
  }

  /**
   * Get logs for contact
   */
  static async getContactLogs(contactId) {
    const sql = 'SELECT * FROM email_logs WHERE contact_id = ? ORDER BY created_at DESC';
    return query(sql, [contactId]);
  }
}
