module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'prettier',
    // 'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
    'airbnb-typescript',
    'node',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'new-cap': 'off',
    'prettier/prettier': 'error',
    'func-names': 'off',
    'no-invalid-this': 'off',
    'no-explicit-any': 'off',
  },
  root: true,
  overrides: [
    {
      files: ['test/*'],
      env: {
        jest: true,
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
};
