const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat()

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      indent: ['error', 2], // ← 2スペースインデント（4にしたい場合は2を4に）
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      'no-unused-vars': ['warn'],
      'no-undef': 'error',
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      curly: 'error'
    }
  }
]