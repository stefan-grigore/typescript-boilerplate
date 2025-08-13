import type { OAuthStoredToken } from '../models/OAuthToken';

const byJti = new Map<string, OAuthStoredToken>();
const byToken = new Map<string, OAuthStoredToken>();

export const TokenDao = {
  save(t: OAuthStoredToken) {
    byJti.set(t.jti, t);
    byToken.set(t.token, t);
  },
  getByToken(token: string) {
    return byToken.get(token);
  },
  pruneExpired(now = Math.floor(Date.now() / 1000)) {
    for (const [jti, rec] of byJti) {
      if (rec.exp <= now) {
        byJti.delete(jti);
        byToken.delete(rec.token);
      }
    }
  },
  clear() {
    byJti.clear();
    byToken.clear();
  },
};

export {};
