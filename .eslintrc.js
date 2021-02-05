module.exports = {
  extends: ['rollup', 'plugin:import/typescript'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/consistent-type-definitions': 'error',
    '@typescript-eslint/member-ordering': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-redeclare': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'local',
        args: 'after-used',
        ignoreRestSiblings: true
      }
    ],
    'import/extensions': [
      'error',
      'always',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never'
      }
    ],
    'import/prefer-default-export': 'off',
    'import/no-namespace': 'off',
    'import/no-named-export': 'off',
    'no-redeclare': 'off',
    'no-unused-vars': 'off',
    'prefer-object-spread': 'off',
    'spaced-comment': 'off',
    'prettier/prettier': [
      'error',
      {
        arrowParens: 'always',
        printWidth: 100,
        singleQuote: true,
        trailingComma: 'none',
        plugins: ['prettier-plugin-package']
      }
    ]
  },
  overrides: [
    {
      "files": ["**/*.ts"],
      "rules": {
        "no-undef": "off"
      }
    }
  ]
};
