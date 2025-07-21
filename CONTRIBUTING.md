# Contributing to Startzondag Vrijwilligers Registratie

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://gitlab.com/YOUR_USERNAME/startzondag-inschrijving.git
   cd startzondag-inschrijving
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up your development environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your development settings
   ```

5. Set up the database:
   ```bash
   npx prisma db push
   npm run seed
   ```

6. Start development:
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Style

- We use TypeScript for type safety
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Run tests with: `npm test`
- Check coverage with: `npm run test:coverage`

### Commit Messages

Follow conventional commits format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

Example: `feat: Add export to PDF functionality`

### Pull Request Process

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit
3. Push to your fork
4. Create a Pull Request with:
   - Clear description of changes
   - Any breaking changes noted
   - Screenshots for UI changes
   - Test results

### Database Changes

If your changes require database schema updates:
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` to test locally
3. Document any migration steps needed

## Security

- Never commit sensitive data
- Always validate user input
- Follow OWASP guidelines
- Report security issues privately

## Questions?

Open an issue for questions or discussions about potential changes.