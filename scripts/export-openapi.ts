import { writeFileSync } from 'fs';
import YAML from 'yaml';
import { buildApp } from '../src/server';

(async () => {
  const app = await buildApp();
  await app.ready();
  const spec = app.swagger();
  writeFileSync('openapi.yaml', YAML.stringify(spec));
//   writeFileSync('openapi.json', JSON.stringify(spec, null, 2));
  await app.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
