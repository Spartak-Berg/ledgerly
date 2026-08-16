const DEFAULT_PORT = 3000;
const DEFAULT_WEB_ORIGIN = 'http://localhost:5173';

export interface Environment {
  databaseUrl: string;
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

  return { databaseUrl, port, webOrigin: parsedOrigin.origin };
}
