import { When, Then } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { TestWorld } from './world';
import { TokenDao } from '../../src/dao/TokenDao';

When('I POST form to {string} with:', async function (
  this: TestWorld,
  path: string,
  table: DataTable
) {
  const data = table.rowsHash() as Record<string, string>;
  await this.inject({
    method: 'POST',
    url: path,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: new URLSearchParams(data).toString(),
  });
});

Then('save {string} as the bearer token', function (this: TestWorld, field: string) {
  const body = this.res.json();
  this.token = body[field];
  assert.ok(this.token, `Expected ${field} in response`);
});

Then('the response status should be {int}', function (this: TestWorld, code: number) {
  if (this.res.statusCode !== code) {
    throw new Error(`Expected ${code} but got ${this.res.statusCode}\nBody: ${this.res.body}`);
  }
});

Then(
  'the response json should have {string} = {string}',
  function (this: TestWorld, key: string, val: string) {
    const body = this.res.json();
    if (body[key] !== val) {
      throw new Error(`Expected ${key}=${val} but got ${JSON.stringify(body)}`);
    }
  }
);

When('I obtain an access token', async function (this: TestWorld) {
  await this.inject({
    method: 'POST',
    url: '/oauth/tokens',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload:
      'grant_type=client_credentials&client_id=my-client&client_secret=supersecret&scope=read:users',
  });
  const body = this.res.json();
  this.token = body.access_token;
  assert.ok(this.token, 'Expected access_token from token endpoint');
});

When('I fast-forward token storage by {int} seconds', function (this: TestWorld, secs: number) {
  const future = Math.floor(Date.now() / 1000) + secs;
  TokenDao.pruneExpired(future); // purge the stored token so verifyBearer sees it as unknown/expired
});

When('I GET {string} with saved bearer', async function (this: TestWorld, path: string) {
  assert.ok(this.token, 'No saved token; call "I obtain an access token" first');
  await this.inject({
    method: 'GET',
    url: path,
    headers: { authorization: `Bearer ${this.token}` },
  });
});

When('I corrupt the stored JTI for the saved bearer', function (this: TestWorld) {
  assert.ok(this.token, 'No saved token; call "I obtain an access token" first');
  const rec = TokenDao.getByToken(this.token!);
  assert.ok(rec, 'Token not found in TokenDao');
  // mutate the in-memory record so it no longer matches the JWT payload.jti
  rec!.jti = rec!.jti + '-mismatch';
});