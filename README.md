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

## BDD
- Features: `features/*.feature`
- Steps: `features/steps/**/*.ts`
- In-process via `buildApp()` + `app.inject()`
```bash
npm run bdd
```

## Coverage (HTML; only src/**)
```bash
npm run coverage:view
```
(Collect JSON + text → render HTML + lcov → open `coverage/index.html`)

## Docker

### build
docker build -t ts-boilerplate .

### run
```bash
docker run -d --rm -p 3000:3000 \
  -e JWT_SECRET=please-change-me \
  -e CLIENT_ID=my-client \
  -e CLIENT_SECRET=supersecret \
  --name tsb ts-boilerplate
```

### stop
```bash
docker stop tsb
```