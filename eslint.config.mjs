import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
  /* ── Ignore patterns ── */
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'node_modules_old/**',
      'src_backup/**',
      '*.config.*',
      'postcss.config.js',
    ],
  },

  /* ── Base JS rules ── */
  js.configs.recommended,

  /* ── TypeScript rules ── */
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      /* ── Relax for migration ── */
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off',

      /* ── Best practices ── */
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },

  /* ── Prettier ── */
  prettierConfig,
];
