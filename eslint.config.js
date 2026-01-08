import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Strict type checking
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Allow type assertions where needed
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Consistency
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Relaxed rules for pragmatic development
      '@typescript-eslint/no-extraneous-class': 'off',

      // Allow template literals with numbers (common pattern)
      '@typescript-eslint/restrict-template-expressions': 'off',

      // Allow deprecated APIs (will update when ready)
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  }
);
