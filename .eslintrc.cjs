module.exports = {
    env: {
      es2021: true,
      node: true,
    },
    extends: [
      'prettier',
      'airbnb-typescript',
      'plugin:@typescript-eslint/recommended',
    ],
    overrides: [
      {
        files: ['.eslintrc.js', '.eslintrc.cjs'],
        env: {
          node: true,
        },
        parserOptions: {
          ecmaVersion: 2015,
          sourceType: 'module',
        },
      },
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
  },
  ignorePatterns: ["**/*.cjs"], // Exclude .cjs files from ESLint
  plugins: ['@typescript-eslint'],
  rules: {
      'new-cap': 'off',
      'prettier/prettier': 'error',
      'func-names': 'off',
      'no-invalid-this': 'off',
      'no-explicit-any': 'off',
      'no-unused-vars': 'error',
      'no-console': 'off',
      'func-names': 'off',
      'no-process-exit': 'off',
      'object-shorthand': 'off',
      'class-methods-use-this': 'off',
      'linebreak-style': 'off',
      'arrow-body-style': 'error',
      'prefer-arrow-callback': 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
  