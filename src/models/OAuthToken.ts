import { z } from 'zod';

export const TokenRequestSchema = z.object({
  grant_type: z.string(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  scope: z.string().optional().describe('Space-delimited scopes'),
});

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  scope: z.string().optional(),
});

export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const OAuthStoredTokenSchema = z.object({
  token: z.string(),
  jti: z.string(),
  sub: z.string(),
  scope: z.string().optional(),
  iat: z.number().int().nonnegative().describe('Issued-at (seconds since epoch)'),
  exp: z.number().int().nonnegative().describe('Expiry (seconds since epoch)'),
});
export type OAuthStoredToken = z.infer<typeof OAuthStoredTokenSchema>;
