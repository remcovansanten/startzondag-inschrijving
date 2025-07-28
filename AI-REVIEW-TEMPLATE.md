# AI Code Review Template for Claude

Use this template when asking Claude to review your code changes.

## Review Request Template

```
Please review this Git diff for the Startzondag volunteer registration application.

**Context:**
- Application: Church volunteer registration system
- Tech stack: Next.js 15.4, TypeScript, PostgreSQL, Prisma
- Current branch: [branch name]
- Purpose of changes: [brief description]

**Git Diff:**
[Paste git diff --cached output here]

**Please check for:**
- [ ] TypeScript type safety and proper typing
- [ ] React best practices and performance
- [ ] Security vulnerabilities (XSS, SQL injection, auth issues)
- [ ] Accessibility compliance (WCAG AA)
- [ ] Error handling and edge cases
- [ ] Database query optimization
- [ ] Test coverage for new code
- [ ] Dutch language consistency
- [ ] Mobile responsiveness considerations

**Specific concerns:**
[Any specific areas you want Claude to focus on]

**Environment:**
- [ ] Development
- [ ] Test
- [ ] Acceptance
- [ ] Production
```

## Quick Review Commands

```bash
# Copy staged changes for review
git diff --cached | pbcopy  # macOS
git diff --cached | xclip -selection clipboard  # Linux

# Copy specific file changes
git diff --cached path/to/file | pbcopy

# Copy last commit for review
git show HEAD | pbcopy
```

## Common Review Points

### Security Checklist
- Input validation and sanitization
- Authentication and authorization checks
- Secure password handling
- CSRF protection
- Rate limiting implementation
- Secure session management
- Environment variable usage

### Performance Checklist
- Unnecessary re-renders in React
- Proper use of useMemo/useCallback
- Database query optimization (N+1 queries)
- Image optimization
- Bundle size impact
- API response times

### Code Quality Checklist
- Clear variable and function names
- Proper error messages in Dutch
- Consistent code style
- No console.log statements
- Proper TypeScript types (no `any`)
- Comments for complex logic

### Testing Checklist
- Unit tests for new functions
- Integration tests for API endpoints
- E2E tests for user flows
- Error case testing
- Edge case handling

## Example Review Request

```
Please review this Git diff for the Startzondag volunteer registration application.

**Context:**
- Application: Church volunteer registration system
- Tech stack: Next.js 15.4, TypeScript, PostgreSQL, Prisma
- Current branch: feature/email-notifications
- Purpose of changes: Adding email notification system for task reminders

**Git Diff:**
diff --git a/lib/email.ts b/lib/email.ts
index 1234567..abcdefg 100644
--- a/lib/email.ts
+++ b/lib/email.ts
@@ -20,6 +20,18 @@ export async function sendConfirmationEmail(
   }
 }

+export async function sendReminderEmail(
+  to: string,
+  taskName: string,
+  taskDate: Date
+) {
+  const html = `<p>Herinnering: U bent aangemeld voor ${taskName} op ${taskDate}</p>`
+  
+  await resend.emails.send({
+    from: EMAIL_FROM,
+    to,
+    subject: `Herinnering: ${taskName}`,
+    html
+  })
+}

**Please check for:**
- [x] TypeScript type safety and proper typing
- [x] React best practices and performance
- [x] Security vulnerabilities
- [x] Error handling and edge cases
- [x] Dutch language consistency

**Specific concerns:**
- Is the date formatting appropriate for Dutch users?
- Should we add retry logic like in sendConfirmationEmail?
- Do we need to validate the email address format?
```

## After Review Actions

1. **Address all critical issues** before committing
2. **Consider suggestions** for improvement
3. **Add tests** for any edge cases identified
4. **Update documentation** if needed
5. **Thank Claude** for the review! 🤖