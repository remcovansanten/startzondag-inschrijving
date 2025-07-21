# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-21

### Added
- Initial release of Startzondag Vrijwilligers Registratie
- Public task overview with real-time availability
- Volunteer registration with email confirmation
- Edit/cancel functionality via unique links
- Admin dashboard with full CRUD operations
- Excel export functionality for registrations
- Church branding (GKE logo and colors)
- WCAG AA accessibility compliance
- Email integration with Resend API
- Rate limiting for registration attempts
- Phone number validation for Dutch numbers
- Database transaction support to prevent race conditions
- Duplicate registration detection
- Email retry mechanism with exponential backoff
- Comprehensive error handling

### Security
- JWT-based authentication for admin
- Bcrypt password hashing
- Input validation and sanitization
- HTTPS enforcement in production
- Rate limiting protection

### Technical
- Built with Next.js 15.4 and TypeScript
- PostgreSQL database with Prisma ORM
- Prisma Accelerate for production
- Tailwind CSS for styling
- Responsive design for all devices
- Test suite with Jest and Testing Library