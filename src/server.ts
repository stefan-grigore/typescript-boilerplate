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
        title: 'Typescript boilerplate',
        description: 'Fastify + Zod + Swagger + OAuth2 (client_credentials)',
        version: '1.0.0',
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
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { persistAuthorization: true },
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err?.validation) {
      return reply.status(400).send({
        error: 'invalid_request',
        error_description: (err as any).message,
      });
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

  // Auth gate (uses AccessControlService.verifyBearer)
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
      (req as any).user = payload;
    } catch {
      return reply.code(401).send({
        error: 'invalid_token',
        error_description: 'Invalid or expired token',
      });
    }
  };

  // Routes
  await registerOAuthRoutes(app);
  await registerUserRoutes(app, requireAuth);

  return app;
}
