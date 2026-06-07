# Portfolio Contact System - Complete Setup Guide

## Overview

A production-ready contact form system for your portfolio website with:
- **Frontend**: Contact form on GitHub Pages
- **Backend**: Node.js/Express API on Vercel
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Admin Dashboard**: Message management and analytics
- **Security**: Rate limiting, input validation, JWT auth

## Quick Start

### 1. Local Development Setup

#### Backend Setup
```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your configuration
npm run dev
```

#### Frontend Setup
1. Open `frontend/index.html` in your browser
2. Update the `API_URL` in `frontend/script.js` if needed
3. Test the contact form

#### Admin Dashboard Setup
1. Open `admin/login.html` in your browser
2. First login will require setup (POST to `/api/admin/setup`)
3. Create initial admin user

### 2. Environment Variables

Create `.env` file in backend directory:

```env
# Development
NODE_ENV=development
DATABASE_URL=sqlite://./database/contacts.db
SQLITE_PATH=./database/contacts.db

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@example.com
OWNER_EMAIL=your-email@gmail.com

# API
PORT=3001
FRONTEND_URL=http://localhost
JWT_SECRET=your-secret-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

### 3. Database Setup

The database is automatically initialized on first run.

For PostgreSQL (production):
```bash
npm install pg
# Set DATABASE_URL in .env
```

### 4. Email Configuration

#### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `.env` as `EMAIL_PASS`

#### Alternative Email Services
Modify `backend/config/email.js` to support other SMTP providers.

### 5. Initial Admin User

Create your first admin user:
```bash
# Via API endpoint
curl -X POST http://localhost:3001/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "secure-password"
  }'
```

## Project Structure

```
portfolio-contact-system/
├── backend/                 # Node.js API
│   ├── server.js           # Entry point
│   ├── routes/             # API routes
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── models/             # Database models
│   ├── middleware/         # Authentication, validation
│   ├── database/           # Database setup
│   ├── config/             # Configuration
│   └── package.json
│
├── frontend/               # Contact form
│   ├── index.html          # Form HTML
│   ├── style.css           # Styling
│   └── script.js           # Form handling
│
├── admin/                  # Admin dashboard
│   ├── login.html          # Login page
│   ├── dashboard.html      # Main dashboard
│   ├── dashboard.css       # Styling
│   └── dashboard.js        # Functionality
│
└── deployment/             # Deployment config
    ├── vercel.json         # Vercel configuration
    ├── .env.example        # Environment template
    └── README.md           # This file
```

## API Endpoints

### Public Endpoints
```
POST   /api/contact              # Submit contact form
GET    /api/health               # Health check
```

### Admin Endpoints (require authentication)
```
POST   /api/admin/login          # Admin login
POST   /api/admin/setup          # Create first admin user
GET    /api/admin/verify         # Verify token
GET    /api/admin/me             # Get current user
POST   /api/admin/logout         # Logout

GET    /api/contact              # Get all messages (paginated)
GET    /api/contact/:id          # Get message detail
PUT    /api/contact/:id/status   # Update message status
DELETE /api/contact/:id          # Delete message
GET    /api/contact/export/csv   # Export as CSV
GET    /api/contact/stats/overview # Get statistics

GET    /api/analytics/stats      # Overall stats
GET    /api/analytics/daily      # Daily submissions
GET    /api/analytics/weekly     # Weekly submissions
GET    /api/analytics/monthly    # Monthly submissions
GET    /api/analytics/domains    # Top contact domains
GET    /api/analytics/status     # Message by status
```

## Security Features

✅ Rate limiting on contact form (5 submissions per 15 min)
✅ Input validation and sanitization
✅ Honeypot field to catch spam bots
✅ JWT token authentication for admin
✅ CORS configuration
✅ Helmet.js security headers
✅ SQL injection prevention
✅ XSS protection
✅ CSRF tokens
✅ Secure password hashing (bcryptjs)

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Configure PostgreSQL database (or use SQLite)
5. Deploy!

```bash
# Or use Vercel CLI
vercel
```

### Environment Variables on Vercel

Set these in your Vercel project settings:
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=your-secret-key`
- `EMAIL_SERVICE=gmail`
- `EMAIL_USER=your-email@gmail.com`
- `EMAIL_PASS=your-app-password`
- `FRONTEND_URL=https://your-domain.com`

### Frontend Deployment (GitHub Pages)

1. Push frontend files to your GitHub Pages repository
2. Update `API_URL` in `frontend/script.js` to your Vercel API URL
3. GitHub Pages will serve the contact form

## Testing

### Test Contact Form Submission
```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Test",
    "message": "This is a test message",
    "honeypot": ""
  }'
```

### Test Admin Login
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
```

### Test Rate Limiting
```bash
# Send 6 requests in quick succession - 6th should be rejected
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/contact ...
done
```

## Troubleshooting

### Email not sending
- Check EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS in .env
- For Gmail, verify app password is generated correctly
- Check logs for errors

### Database connection error
- Verify DATABASE_URL or SQLITE_PATH is correct
- Ensure database server is running (PostgreSQL)
- Check database permissions

### CORS errors
- Verify FRONTEND_URL matches your frontend domain
- Check CORS headers in server.js

### Admin dashboard not loading
- Check JWT_SECRET is set correctly
- Verify token is stored in localStorage
- Check browser console for errors

## Performance Optimization

- Database indexing on frequently queried fields
- Pagination limit of 100 to prevent large responses
- Rate limiting to prevent abuse
- Message compression
- SQL query optimization

## Monitoring & Logging

Logs are stored in `logs/` directory:
- `requests.log` - All HTTP requests
- `errors.log` - Application errors
- `security.log` - Security events

## License

MIT

## Support

For issues and questions, refer to the documentation or create an issue on GitHub.
