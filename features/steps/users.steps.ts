import { Given, When, Then } from '@cucumber/cucumber';
import { strict as assert } from 'assert';
import { TestWorld } from './world';
import { UserService } from '../../src/services/UserService';

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

Then('I remember the user id', function (this: TestWorld) {
  const body = this.res.json();
  const id = body?.id;
  assert.ok(id, 'Expected id in response');
  (this as any).vars = (this as any).vars ?? {};
  (this as any).vars.userId = id;
});

When('I GET that user', async function (this: TestWorld) {
  const vars = (this as any).vars || {};
  const id = vars.userId;
  assert.ok(id, 'No remembered user id; call "I remember the user id" first');

  await this.inject({
    method: 'GET',
    url: `/users/${id}`,
    headers: this.token ? { authorization: `Bearer ${this.token}` } : undefined,
  });
});

When('I GET {string} while the service crashes', async function (
  this: TestWorld,
  path: string
) {
  assert.ok(this.token, 'Need a token; use "Given I have a valid access token" first');

  const original = UserService.list;
  try {
    // Make the service blow up for this one call
    (UserService as any).list = () => {
      throw new Error('kaboom');
    };

    await this.inject({
      method: 'GET',
      url: path,
      headers: { authorization: `Bearer ${this.token}` },
    });
  } finally {
    // Always restore so other scenarios aren't affected
    (UserService as any).list = original;
  }
});