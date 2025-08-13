import { When, Then } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { TestWorld } from './world';

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
