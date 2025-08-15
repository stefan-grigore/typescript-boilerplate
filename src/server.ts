import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import formbody from '@fastify/formbody';
import { ZodTypeProvider, jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { config } from './config';
import { verifyBearer } from './services/AccessControlService';
import { registerOAuthRoutes } from './routes/oauth';
import { registerUserRoutes } from './routes/users';
import { ApiError } from './models/ApiError';

const API_VERSION = '1.0.0';

export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  // Plugins
  await app.register(cors, { origin: true });
  await app.register(formbody);

  // Global response headers
  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('x-api-version', API_VERSION);
    return payload;
  });

  // Zod <-> Fastify
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Typescript boilerplate',
        description: 'Fastify + Zod + Swagger + OAuth2 (client_credentials)',
        version: API_VERSION,
      },
      servers: [{ url: `http://localhost:${config.PORT}` }],
      components: {
        securitySchemes: {
          bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          oauth2: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: config.OAUTH2_AUTH_URL,
                tokenUrl: config.OAUTH2_TOKEN_URL,
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
    transform: (opts: any) => {
      const result: any = jsonSchemaTransform(opts);
      if (result?.schema?.response) {
        for (const status of Object.keys(result.schema.response)) {
          const res = result.schema.response[status] as any;
          res.headers = {
            ...(res.headers || {}),
            'x-api-version': { type: 'string', description: 'API version', example: API_VERSION },
          };
        }
      }
      return result;
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { persistAuthorization: true },
  });

  app.setErrorHandler((err, _req, reply) => {
    return reply.status(500).send(ApiError.serverError());
  });

  // Auth gate (uses AccessControlService.verifyBearer)
  const requireAuth = async (req: any, reply: any) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.code(401).send(ApiError.invalidRequest('Missing or invalid Authorization header'));
    }
    const token = auth.slice('Bearer '.length);
    try {
      const payload = await verifyBearer(token);
      (req as any).user = payload;
    } catch {
      return reply.code(401).send(ApiError.invalidToken('Invalid or expired token'));
    }
  };

  // Routes
  await registerOAuthRoutes(app);
  await registerUserRoutes(app, requireAuth);

  return app;
}
