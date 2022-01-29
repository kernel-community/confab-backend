module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended', 'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'object-curly-spacing': ['error', 'always'],
    'import/no-unresolved': ['off'],
    'import/prefer-default-export': ['off'],
    'import/extensions': ['off'],
  },
};
