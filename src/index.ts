import { buildApp } from './server';
import { config } from './config';

export { buildApp };

async function main() {
  const app = await buildApp();
  await app.listen({ port: config.PORT, host: '0.0.0.0' });
  app.log.info(`🚀 up at http://localhost:${config.PORT}  |  docs → /docs`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
