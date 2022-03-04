module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['google', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'new-cap': 'off',
    'prettier/prettier': 'error',
    'func-names': 'off',
    'no-invalid-this': 'off',
  },
};
