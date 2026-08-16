const DEFAULT_PORT = 3000;
const DEFAULT_WEB_ORIGIN = 'http://localhost:5173';
const EXAMPLE_ACCESS_SECRET = 'replace-with-at-least-32-random-characters';

export interface Environment {
  accessTokenSecret: string;
  databaseUrl: string;
  isProduction: boolean;
  port: number;
  webOrigin: string;
}

export function readEnvironment(): Environment {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const webOrigin = process.env.WEB_ORIGIN?.trim() || DEFAULT_WEB_ORIGIN;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(webOrigin);
  } catch {
    throw new Error('WEB_ORIGIN must be a valid absolute URL');
  }
  if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
    throw new Error('WEB_ORIGIN must use http or https');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const developmentSecret =
    'ledgerly-development-only-secret-change-before-production';
  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET?.trim() ||
    (isProduction ? '' : developmentSecret);
  if (
    accessTokenSecret.length < 32 ||
    (isProduction && accessTokenSecret === EXAMPLE_ACCESS_SECRET)
  ) {
    throw new Error('ACCESS_TOKEN_SECRET must contain at least 32 characters');
  }

  return {
    accessTokenSecret,
    databaseUrl,
    isProduction,
    port,
    webOrigin: parsedOrigin.origin,
  };
}
