# Instructions to Remove Exposed Secrets from Git History

## CRITICAL: Actions Required Immediately

### 1. Revoke All Exposed Credentials NOW
- **Resend API Key**: Go to https://resend.com/api-keys and revoke `<REDACTED-resend-key-rotated>`
- **Database**: Change the database password for the exposed connection string
- **Admin Password**: Change the production admin password from `<REDACTED-admin-password-obsolete>`
- **JWT Secrets**: Generate new JWT secrets for all environments

### 2. Remove Secrets from Git History

Since the secrets are already pushed to GitHub/GitLab, you need to remove them from history:

#### Option A: Using BFG Repo-Cleaner (Recommended)
```bash
# 1. Clone a fresh copy of your repo
git clone --mirror https://github.com/remcovansanten/startzondag-inschrijving.git

# 2. Download BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# 3. Create a file with all the secrets to remove
echo '<REDACTED-resend-key-rotated>' > passwords.txt
echo '<REDACTED-admin-password-obsolete>' >> passwords.txt
echo 'IGoXeYj3rpHFRIFavJD6xX4xjltc028fbhCwGzI7dd0=' >> passwords.txt
echo '<REDACTED-rotate-in-prisma-console>' >> passwords.txt
echo '19a91092569789773f3a33c429af4ec70eee7a6cbf162e6e2d7a0cfb28ea7c48' >> passwords.txt

# 4. Run BFG to remove secrets
java -jar bfg-1.14.0.jar --replace-text passwords.txt startzondag-inschrijving.git

# 5. Clean up the repo
cd startzondag-inschrijving.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 6. Force push the cleaned history
git push --force
```

#### Option B: Using git filter-branch
```bash
# Remove specific files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch GITHUB_SECRETS_SETUP.md scripts/add-github-secrets.sh" \
  --prune-empty --tag-name-filter cat -- --all
```

### 3. Notify Your Team
- Inform all team members that they need to re-clone the repository
- Anyone with a local copy should delete it and clone fresh

### 4. Update GitHub/GitLab
- Consider the exposed secrets as compromised forever
- Even after removal, they may exist in forks, clones, or caches
- Add branch protection rules to prevent direct pushes to main branches

### 5. Prevention for the Future
- NEVER put real credentials in documentation
- Always use placeholders like `YOUR_API_KEY_HERE`
- Use environment variables and .env files (already in .gitignore)
- Consider using tools like git-secrets to prevent accidental commits

## Files Already Fixed:
- ✅ GITHUB_SECRETS_SETUP.md - Credentials replaced with placeholders
- ✅ scripts/add-github-secrets.sh - Now prompts for credentials instead of hardcoding
- ✅ Added both files to .gitignore

## Remember:
Once credentials are exposed on GitHub, they should be considered compromised forever, even if removed from history.