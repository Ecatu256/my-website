/**
 * Input validation and sanitization middleware
 */

import validator from 'validator';

/**
 * Validate contact form submission
 */
export const validateContactForm = (req, res, next) => {
  const { name, email, subject, message, honeypot } = req.body;
  const errors = {};

  // Check honeypot (anti-spam field)
  if (honeypot) {
    return res.status(400).json({
      success: false,
      message: 'Invalid submission',
    });
  }

  // Validate name
  if (!name || typeof name !== 'string') {
    errors.name = 'Name is required';
  } else if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters';
  } else if (!validator.isAlpha(name.replace(/\s/g, ''))) {
    errors.name = 'Name can only contain letters and spaces';
  }

  // Validate email
  if (!email || typeof email !== 'string') {
    errors.email = 'Email is required';
  } else if (!validator.isEmail(email)) {
    errors.email = 'Please provide a valid email address';
  } else if (email.length > 255) {
    errors.email = 'Email is too long';
  }

  // Validate subject
  if (!subject || typeof subject !== 'string') {
    errors.subject = 'Subject is required';
  } else if (subject.length < 3 || subject.length > 200) {
    errors.subject = 'Subject must be between 3 and 200 characters';
  }

  // Validate message
  if (!message || typeof message !== 'string') {
    errors.message = 'Message is required';
  } else if (message.length < 10 || message.length > 5000) {
    errors.message = 'Message must be between 10 and 5000 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Sanitize contact data
 */
export const sanitizeContact = (req, res, next) => {
  const { name, email, subject, message } = req.body;

  req.body = {
    name: validator.trim(validator.escape(name)),
    email: validator.normalizeEmail(email),
    subject: validator.trim(validator.escape(subject)),
    message: validator.trim(validator.escape(message)),
    honeypot: req.body.honeypot || '',
  };

  next();
};

/**
 * Validate login credentials
 */
export const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = {};

  if (!username || typeof username !== 'string') {
    errors.username = 'Username is required';
  } else if (username.length < 3 || username.length > 50) {
    errors.username = 'Username must be between 3 and 50 characters';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  } else if (password.length < 6 || password.length > 100) {
    errors.password = 'Password must be between 6 and 100 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100; // Max 100 per page

  req.pagination = { page, limit };
  next();
};
