import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { TokenDao } from '../dao/TokenDao';
import type { OAuthStoredToken } from '../models/OAuthToken';

const secretKey = new TextEncoder().encode(config.JWT_SECRET);

export async function issueAccessToken(subject: string, scope?: string): Promise<{
  token: string;
  expiresIn: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const jti = randomUUID();
  const exp = now + config.ACCESS_TOKEN_TTL;

  const token = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setIssuer(config.ISSUER)
    .setAudience(config.AUDIENCE)
    .setSubject(subject)
    .setJti(jti)
    .setExpirationTime(exp)
    .sign(secretKey);

  TokenDao.pruneExpired(now);
  const rec: OAuthStoredToken = { token, jti, sub: subject, scope, iat: now, exp };
  TokenDao.save(rec);

  return { token, expiresIn: config.ACCESS_TOKEN_TTL };
}

export async function verifyBearer(token: string): Promise<JWTPayload> {
  TokenDao.pruneExpired();
  const rec = TokenDao.getByToken(token);
  if (!rec) {
    const e: any = new Error('Unknown token');
    e.statusCode = 401;
    e.error = 'invalid_token';
    e.error_description = 'Unknown token';
    throw e;
  }

  const { payload } = await jwtVerify(token, secretKey, {
    issuer: config.ISSUER,
    audience: config.AUDIENCE,
  });

  if (payload.jti && payload.jti !== rec.jti) {
    const e: any = new Error('Token mismatch');
    e.statusCode = 401;
    e.error = 'invalid_token';
    e.error_description = 'Token mismatch';
    throw e;
  }

  return payload;
}

export function validateClient(id?: string, secret?: string): boolean {
  return id === config.CLIENT_ID && secret === config.CLIENT_SECRET;
}
