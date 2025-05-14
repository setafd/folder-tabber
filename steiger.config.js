import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['./src/**'],
    rules: {
      'fsd/no-segmentless-slices': 'off',
      'fsd/insignificant-slice': 'off',
    },
  },
]);
