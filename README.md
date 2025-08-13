# TS Boilerplate — Fastify + Zod + Swagger + OAuth2 + BDD

Tiny TypeScript microservice:
- Fastify API with **OpenAPI** at `/docs`
- **Zod** schemas → docs match runtime
- OAuth2 **client-credentials** token at `/oauth/tokens` (form urlencoded)
- JWT HS256 via **JOSE**, Bearer-protected routes
- **Cucumber** BDD tests + **c8** coverage (HTML) for `src/**` only

## Quickstart
```bash
npm i
npm run dev          # http://localhost:3000
# Docs: http://localhost:3000/docs
```

## Env (optional)
```
PORT=3000
JWT_ISSUER=http://localhost
JWT_AUDIENCE=https://your.api
JWT_SECRET=dev-secret-change-me
ACCESS_TOKEN_TTL=3600
CLIENT_ID=my-client
CLIENT_SECRET=supersecret
DEFAULT_SCOPE=read:users
OAUTH2_AUTH_URL=https://example/authorize
OAUTH2_TOKEN_URL=https://example/token
```

## BDD
- Features: `features/*.feature`
- Steps: `features/steps/**/*.ts`
- In-process via `buildApp()` + `app.inject()`
```bash
npm run bdd
```

## Coverage (HTML; only src/**)
One-shot:
```bash
npm run coverage:view
```
(Collect JSON + text → render HTML + lcov → open `coverage/index.html`)
