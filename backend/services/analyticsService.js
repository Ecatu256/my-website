/**
 * Analytics service
 * Handles analytics and statistics queries
 */

import { query } from '../database/connection.js';

/**
 * Get daily submission count for last N days
 */
export const getDailyStats = async (days = 30) => {
  const sql = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM contacts
    WHERE created_at >= datetime('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  return query(sql);
};

/**
 * Get weekly submission count
 */
export const getWeeklyStats = async (weeks = 12) => {
  const sql = `
    SELECT
      strftime('%Y-W%W', created_at) as week,
      COUNT(*) as count
    FROM contacts
    WHERE created_at >= datetime('now', '-${weeks * 7} days')
    GROUP BY strftime('%Y-W%W', created_at)
    ORDER BY week DESC
  `;

  return query(sql);
};

/**
 * Get monthly submission count
 */
export const getMonthlyStats = async (months = 12) => {
  const sql = `
    SELECT
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as count
    FROM contacts
    WHERE created_at >= datetime('now', '-${months} months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
  `;

  return query(sql);
};

/**
 * Get most common contact domains
 */
export const getTopDomains = async (limit = 10) => {
  const sql = `
    SELECT
      SUBSTR(email, INSTR(email, '@') + 1) as domain,
      COUNT(*) as count
    FROM contacts
    GROUP BY domain
    ORDER BY count DESC
    LIMIT ?
  `;

  return query(sql, [limit]);
};

/**
 * Get message count by status
 */
export const getStatusStats = async () => {
  const sql = `
    SELECT
      status,
      COUNT(*) as count
    FROM contacts
    GROUP BY status
  `;

  return query(sql);
};

/**
 * Get average response time
 */
export const getAverageResponseTime = async () => {
  const sql = `
    SELECT
      AVG(CAST((julianday(replied_at) - julianday(created_at)) * 24 * 60 AS REAL)) as avg_minutes
    FROM contacts
    WHERE status = 'replied' AND replied_at IS NOT NULL
  `;

  const result = await query(sql);
  return result[0];
};

/**
 * Get total statistics
 */
export const getTotalStats = async () => {
  const stats = {};

  // Total contacts
  const totalResult = await query('SELECT COUNT(*) as count FROM contacts');
  stats.total = totalResult[0].count;

  // By status
  const statusResult = await query(`
    SELECT
      status,
      COUNT(*) as count
    FROM contacts
    GROUP BY status
  `);

  stats.byStatus = {};
  statusResult.forEach((row) => {
    stats.byStatus[row.status] = row.count;
  });

  // This month
  const thisMonthResult = await query(`
    SELECT COUNT(*) as count
    FROM contacts
    WHERE created_at >= datetime('now', 'start of month')
  `);
  stats.thisMonth = thisMonthResult[0].count;

  // This week
  const thisWeekResult = await query(`
    SELECT COUNT(*) as count
    FROM contacts
    WHERE created_at >= datetime('now', '-7 days')
  `);
  stats.thisWeek = thisWeekResult[0].count;

  // Today
  const todayResult = await query(`
    SELECT COUNT(*) as count
    FROM contacts
    WHERE DATE(created_at) = DATE('now')
  `);
  stats.today = todayResult[0].count;

  return stats;
};
