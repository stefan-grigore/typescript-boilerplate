import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TokenRequestSchema, TokenResponseSchema } from '../models/OAuthToken';
import { ApiError, ErrorResponseSchema } from '../models/ApiError';
import { config } from '../config';
import { issueAccessToken, validateClient } from '../services/AccessControlService';

export async function registerOAuthRoutes(app: FastifyInstance) {
  app.route({
    method: 'POST',
    url: '/oauth/tokens',
    schema: {
      tags: ['oauth'],
      summary: 'Token endpoint (Client Credentials)',
      description:
        'Exchanges client_id/client_secret for a bearer access token using the client_credentials grant.',
      body: TokenRequestSchema,
      response: {
        200: TokenResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
      },
    },
    handler: async (req, reply) => {
      const { grant_type, client_id, client_secret} = req.body as z.infer<
        typeof TokenRequestSchema
      >;

      if (grant_type !== 'client_credentials') {
        return reply.code(400).send(ApiError.unsupportedGrantType('Only client_credentials is supported'));
      }

      if (!client_id || !client_secret) {
        return reply.code(400).send(ApiError.invalidRequest('client_id and client_secret are required for client_credentials'));
      }

      if (!validateClient(client_id, client_secret)) {
        reply.header('WWW-Authenticate', 'Basic realm="oauth", error="invalid_client"');
        return reply.code(401).send(ApiError.invalidClient('Client authentication failed'));
      }

      const { token, expiresIn } = await issueAccessToken(client_id, config.CLIENT_SCOPE);

      return reply.send({
        access_token: token,
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope: config.CLIENT_SCOPE
      });
    },
  });
}
