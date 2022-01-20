module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es2021': true,
    "es6": true,
  },
  'extends': [
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 13,
  },
  'rules': {
    "brace-style": [
      "error",
      "stroustrup"
    ],
    "comma-dangle": [
      "error",
      "never"
    ],
    "no-unused-vars": [
      "warn"
    ],
    "no-var": [
      "off"
    ],
    "one-var": [
      "off"
    ]
  },
};
