import { readEnvironment } from './environment';

describe('readEnvironment', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original, DATABASE_URL: 'postgresql://localhost/test' };
    delete process.env.PORT;
    delete process.env.WEB_ORIGIN;
  });

  afterAll(() => {
    process.env = original;
  });

  it('applies safe local defaults', () => {
    expect(readEnvironment()).toEqual({
      accessTokenSecret:
        'ledgerly-development-only-secret-change-before-production',
      databaseUrl: 'postgresql://localhost/test',
      isProduction: false,
      port: 3000,
      webOrigin: 'http://localhost:5173',
    });
  });

  it('requires a strong secret in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ACCESS_TOKEN_SECRET;
    expect(() => readEnvironment()).toThrow(
      'ACCESS_TOKEN_SECRET must contain at least 32 characters',
    );
  });

  it('rejects a missing database URL', () => {
    delete process.env.DATABASE_URL;
    expect(() => readEnvironment()).toThrow('DATABASE_URL is not configured');
  });

  it('rejects invalid ports and origins', () => {
    process.env.PORT = 'not-a-port';
    expect(() => readEnvironment()).toThrow('PORT must be an integer');

    process.env.PORT = '3000';
    process.env.WEB_ORIGIN = 'file:///tmp/ledgerly';
    expect(() => readEnvironment()).toThrow(
      'WEB_ORIGIN must use http or https',
    );
  });
});
