import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserSchema, CreateUserSchema } from '../models/User';
import { ApiError, ErrorResponseSchema } from '../models/ApiError';
import { UserService } from '../services/UserService';

export async function registerUserRoutes(
  app: FastifyInstance,
  requireAuth: (scope?: string) => (req: any, reply: any) => Promise<any>
) {
  app.route({
    method: 'GET',
    url: '/users',
    preHandler: requireAuth('user'),
    schema: {
      tags: ['users'],
      security: [{ bearer: [] }, { oauth2: ['user'] }],
      response: {
        200: UserSchema.array(),
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
      },
      summary: 'List users',
    },
    handler: async () => UserService.list(),
  });

  app.route({
    method: 'GET',
    url: '/users/:id',
    preHandler: requireAuth('user'),
    schema: {
      tags: ['users'],
      security: [{ bearer: [] }, { oauth2: ['user'] }],
      params: z.object({ id: z.string() }),
      response: {
        200: UserSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        403: ErrorResponseSchema,
      },
      summary: 'Get one user',
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const u = UserService.get(id);
      if (!u) {
        return reply.code(404).send(ApiError.notFound('User not found'));
      }
      return u;
    },
  });

  app.route({
    method: 'POST',
    url: '/users',
    preHandler: requireAuth('user'),
    schema: {
      tags: ['users'],
      security: [{ bearer: [] }, { oauth2: ['user'] }],
      body: CreateUserSchema,
      response: {
        200: UserSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
      },
      summary: 'Create user',
    },
    handler: async (req) => {
      const body = req.body as z.infer<typeof CreateUserSchema>;
      return UserService.create(body);
    },
  });
}
