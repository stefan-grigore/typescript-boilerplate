import { Given, When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { TestWorld } from './world';

Given('I have a valid access token', async function (this: TestWorld) {
  await this.inject({
    method: 'POST',
    url: '/oauth/tokens',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: 'grant_type=client_credentials&client_id=my-client&client_secret=supersecret&scope=read:users',
  });
  const body = this.res.json();
  this.token = body.access_token;
  assert.ok(this.token, 'Expected access_token');
});

When('I GET {string}', async function (this: TestWorld, path: string) {
  await this.inject({
    method: 'GET',
    url: path,
    headers: this.bearerHeader(),
  });
});

When('I GET {string} without auth', async function (this: TestWorld, path: string) {
  await this.inject({ method: 'GET', url: path });
});

When('I POST json to {string} with:', async function (this: TestWorld, path: string, docString: string) {
  await this.inject({
    method: 'POST',
    url: path,
    headers: { 'content-type': 'application/json', ...this.bearerHeader() },
    payload: docString,
  });
});

Then('the response json should be an array', function (this: TestWorld) {
  const body = this.res.json();
  if (!Array.isArray(body)) {
    throw new Error(`Expected array, got: ${JSON.stringify(body)}`);
  }
});

Then('the response json should have a string at {string}', function (this: TestWorld, key: string) {
  const body = this.res.json();
  if (typeof body[key] !== 'string') {
    throw new Error(`Expected ${key} to be string, got: ${JSON.stringify(body[key])}`);
  }
});

When('I GET {string} with bearer {string}', async function (this: TestWorld, path: string, token: string) {
  await this.inject({
    method: 'GET',
    url: path,
    headers: { authorization: `Bearer ${token}` },
  });
});

When('I POST json to {string} with bearer {string} and:', async function (
  this: TestWorld,
  path: string,
  token: string,
  docString: string
) {
  await this.inject({
    method: 'POST',
    url: path,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    payload: docString,
  });
});
