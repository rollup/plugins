module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '.test.ts': [
      'ts-jest',
      {
        tsconfig: {
          target: 'esnext',
          sourceMap: true
        }
      }
    ]
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text'],
  collectCoverageFrom: ['src/**/*.ts'],
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/test/**/*test.[jt]s?(x)'],
  testPathIgnorePatterns: process.env.SKIP_E2E
    ? ['/node_modules/', '/examples/__tests__']
    : ['/node_modules/']
};
