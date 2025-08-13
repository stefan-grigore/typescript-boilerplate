export const config = {
  PORT: Number(process.env.PORT ?? 3000),
  ISSUER: process.env.JWT_ISSUER ?? 'http://localhost',
  AUDIENCE: process.env.JWT_AUDIENCE ?? 'https://your.api',
  ACCESS_TOKEN_TTL: Number(process.env.ACCESS_TOKEN_TTL ?? 3600),
  CLIENT_ID: process.env.CLIENT_ID ?? 'my-client',
  CLIENT_SECRET: process.env.CLIENT_SECRET ?? 'supersecret',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  DEFAULT_SCOPE: process.env.DEFAULT_SCOPE ?? 'read:users',
  OAUTH2_AUTH_URL: process.env.OAUTH2_AUTH_URL ?? 'https://example/authorize',
  OAUTH2_TOKEN_URL: process.env.OAUTH2_TOKEN_URL ?? 'https://example/token',
};
