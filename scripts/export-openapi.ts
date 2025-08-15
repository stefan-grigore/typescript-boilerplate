import { writeFileSync } from 'fs';
import YAML from 'yaml';
import { buildApp } from '../src/server';

(async () => {
  const app = await buildApp();
  await app.ready();
  const spec = app.swagger();
  // Add x-api-version header to all responses
  const version = spec.info?.version as string | undefined;
  if (spec.paths) {
    for (const path of Object.values(spec.paths)) {
      for (const method of Object.values(path as any)) {
        if (method.responses) {
          for (const response of Object.values(method.responses)) {
            const headers = (response as any).headers ?? {};
            headers['x-api-version'] = {
              schema: { type: 'string', example: version },
            };
            (response as any).headers = headers;
          }
        }
      }
    }
  }
  writeFileSync('openapi.yaml', YAML.stringify(spec));
//   writeFileSync('openapi.json', JSON.stringify(spec, null, 2));
  await app.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
