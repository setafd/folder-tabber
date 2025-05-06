import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'vite.config.ts'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      pluginReact.configs.flat.recommended,
      eslintConfigPrettier,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      quotes: ['error', 'single'],
      'react/prop-types': 0,
      'import/order': [
        'error',
        {
          pathGroups: [
            {
              pattern: 'react',
              group: 'builtin',
              position: 'before',
            },
            {
              pattern: '@mantine/*',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@app/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@pages/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@widgets/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@features/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@entities/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@shared/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: './*.module.scss',
              group: 'sibling',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
);
