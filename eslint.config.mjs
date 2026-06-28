import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

// Flat config (ESLint 9 / Next 16). Replaces the legacy .eslintrc.json +
// the removed `next lint` command. Mirrors the original ruleset:
// `next/core-web-vitals` only (not the stricter `next/typescript`).
const config = [
  { ignores: ['.next/**', 'coverage/**', 'node_modules/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
]

export default config
