import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);

// ---------------------------------------------------------------
// To run these tests, install the required dev dependencies:
//
//   npm install --save-dev jest @types/jest ts-jest
//
// Then add this script to package.json:
//
//   "test": "jest"
//
// Run tests with:
//
//   npm test
// ---------------------------------------------------------------
