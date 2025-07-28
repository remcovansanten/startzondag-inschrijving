module.exports = {
  // TypeScript and JavaScript files
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests'
  ],
  
  // CSS files
  '*.{css,scss}': [
    'prettier --write'
  ],
  
  // JSON, Markdown, and other files
  '*.{json,md,yml,yaml}': [
    'prettier --write'
  ],
  
  // Prisma schema
  'prisma/schema.prisma': [
    'npx prisma format'
  ]
}