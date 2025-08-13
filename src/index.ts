// src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import formbody from '@fastify/formbody';
import { z } from 'zod';
import {
  ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { SignJWT, jwtVerify } from 'jose';

/**
 * Config
 */
const PORT = Number(process.env.PORT ?? 3000);
const ISSUER = process.env.JWT_ISSUER ?? 'http://localhost';
const AUDIENCE = process.env.JWT_AUDIENCE ?? 'https://your.api';
const ACCESS_TOKEN_TTL = Number(process.env.ACCESS_TOKEN_TTL ?? 3600);
const CLIENT_ID = process.env.CLIENT_ID ?? 'my-client';
const CLIENT_SECRET = process.env.CLIENT_SECRET ?? 'supersecret';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const DEFAULT_SCOPE = process.env.DEFAULT_SCOPE ?? 'read:users';
const OAUTH2_AUTH_URL = process.env.OAUTH2_AUTH_URL ?? 'https://example/authorize';
const OAUTH2_TOKEN_URL = process.env.OAUTH2_TOKEN_URL ?? 'https://example/token';

/**
 * Models (Zod)
 */
const User = z.object({
  id: z.string().describe('User id'),
  email: z.string().email().describe('Email'),
  name: z.string().min(2).describe('Full name'),
});
type TUser = z.infer<typeof User>;

const TokenRequest = z.object({
  grant_type: z.string(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  scope: z.string().optional().describe('Space-delimited scopes'),
});

const TokenResponse = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  scope: z.string().optional(),
});

// Canonical error model used everywhere
const ErrorResponse = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});

/**
 * Fake storage (demo)
 */
const usersDb: Record<string, TUser> = {
  'a12f5bd2-...': { id: 'a12f5bd2-...', email: 'mona.lisa@example.com', name: 'Mona Lisa' },
};

/**
 * Token utils
 */
const secretKey = new TextEncoder().encode(JWT_SECRET);

async function issueAccessToken(subject: string, scope?: string) {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(subject)
    .setExpirationTime(now + ACCESS_TOKEN_TTL)
    .sign(secretKey);

  return { token: jwt, expiresIn: ACCESS_TOKEN_TTL };
}

function validateClient(id: string, secret: string) {
  return id === CLIENT_ID && secret === CLIENT_SECRET;
}

async function verifyBearer(token: string) {
  const { payload } = await jwtVerify(token, secretKey, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return payload;
}

/**
 * Build the Fastify app (exported for BDD tests)
 */
export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  // Plugins
  await app.register(cors, { origin: true });
  await app.register(formbody);

  // Zod <-> Fastify
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Users Service',
        description: 'Fastify + Zod + Swagger + OAuth2 (client_credentials)',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${PORT}` }],
      components: {
        securitySchemes: {
          bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          oauth2: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: OAUTH2_AUTH_URL,
                tokenUrl: OAUTH2_TOKEN_URL,
                scopes: {
                  'read:users': 'Read users',
                  'write:users': 'Write users',
                },
              },
            },
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { persistAuthorization: true },
  });

  // Global error handler → coerces validation/internal errors into ErrorResponse
  app.setErrorHandler((err, _req, reply) => {
    // Validation errors from Fastify/Zod
    // @ts-ignore - fastify adds .validation sometimes
    if (err?.validation) {
      return reply
        .status(400)
        .send({ error: 'invalid_request', error_description: (err as any).message });
    }

    const status = (err as any).statusCode ?? 500;
    const body =
      status === 401
        ? { error: 'invalid_token', error_description: 'Unauthorized' }
        : status === 404
        ? { error: 'not_found', error_description: 'Not found' }
        : { error: 'server_error', error_description: 'Internal server error' };

    return reply.status(status).send(body);
  });

  /**
   * Auth gate (resource server)
   * Returns ErrorResponse on failure
   */
  const requireAuth = async (req: any, reply: any) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'invalid_request',
        error_description: 'Missing or invalid Authorization header',
      });
    }
    const token = auth.slice('Bearer '.length);
    try {
      const payload = await verifyBearer(token);
      (req as any).user = payload; // expose to handlers
    } catch {
      return reply.code(401).send({
        error: 'invalid_token',
        error_description: 'Invalid or expired token',
      });
    }
  };

  /**
   * OAuth 2.0 Token Endpoint (Client Credentials)
   * POST /oauth/tokens  (x-www-form-urlencoded)
   */
  app.route({
    method: 'POST',
    url: '/oauth/tokens',
    schema: {
      tags: ['oauth'],
      summary: 'Token endpoint (Client Credentials)',
      description:
        'Exchanges client_id/client_secret for a bearer access token using the client_credentials grant.',
      body: TokenRequest,
      response: {
        200: TokenResponse,
        400: ErrorResponse,
        401: ErrorResponse,
      },
    },
    handler: async (req, reply) => {
      const { grant_type, client_id, client_secret, scope } = req.body as z.infer<
        typeof TokenRequest
      >;

      if (grant_type !== 'client_credentials') {
        return reply.code(400).send({
          error: 'unsupported_grant_type',
          error_description: 'Only client_credentials is supported',
        });
      }

      // now enforce credentials for client_credentials
      if (!client_id || !client_secret) {
        return reply.code(400).send({
          error: 'invalid_request',
          error_description: 'client_id and client_secret are required for client_credentials',
        });
      }

      if (!validateClient(client_id, client_secret)) {
        reply.header('WWW-Authenticate', 'Basic realm="oauth", error="invalid_client"');
        return reply.code(401).send({
          error: 'invalid_client',
          error_description: 'Client authentication failed',
        });
      }

      const requestedScope = scope || DEFAULT_SCOPE;
      const { token, expiresIn } = await issueAccessToken(client_id, requestedScope);

      return reply.send({
        access_token: token,
        token_type: 'Bearer',
        expires_in: expiresIn,
        ...(requestedScope ? { scope: requestedScope } : {}),
      });
    },
  });

  /**
   * Users API (secured)
   */

  // GET /users
  app.route({
    method: 'GET',
    url: '/users',
    preHandler: requireAuth,
    schema: {
      tags: ['users'],
      security: [{ bearer: [] }, { oauth2: ['read:users'] }],
      response: {
        200: User.array(),
        401: ErrorResponse,
      },
      summary: 'List users',
    },
    handler: async () => Object.values(usersDb),
  });

  // GET /users/:id
  app.route({
    method: 'GET',
    url: '/users/:id',
    preHandler: requireAuth,
    schema: {
      tags: ['users'],
      security: [{ bearer: [] }, { oauth2: ['read:users'] }],
      params: z.object({ id: z.string() }),
      response: {
        200: User,
        401: ErrorResponse,
        404: ErrorResponse,
      },
      summary: 'Get one user',
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const u = usersDb[id];
      if (!u)
        return reply.code(404).send({
          error: 'not_found',
          error_description: 'User not found',
        });
      return u;
    },
  });

  // POST /users
  const CreateUser = User.pick({ email: true, name: true });
  app.route({
    method: 'POST',
    url: '/users',
    preHandler: requireAuth,
    schema: {
      tags: ['users'],
      security: [{ bearer: [] }, { oauth2: ['write:users'] }],
      body: CreateUser,
      response: {
        200: User,
        400: ErrorResponse, // custom 400s; validation 400s are coerced globally
        401: ErrorResponse,
      },
      summary: 'Create user',
    },
    handler: async (req) => {
      const body = req.body as z.infer<typeof CreateUser>;
      const id = `id-${Math.random().toString(36).slice(2, 10)}`;
      const saved: TUser = { id, ...body };
      usersDb[id] = saved;
      return saved;
    },
  });

  return app;
}

/**
 * Start server if run directly
 */
async function main() {
  const app = await buildApp();
  await app.listen({ port: PORT, host: '0.0.0.0' });
  app.log.info(`🚀 up at http://localhost:${PORT}  |  docs → /docs`);
}

// Only run when executed directly (not when imported by tests)
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
