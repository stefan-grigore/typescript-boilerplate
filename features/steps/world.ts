import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify';
import { buildApp } from '../../src/index';

let sharedApp: FastifyInstance | null = null;

export async function getApp(): Promise<FastifyInstance> {
  if (!sharedApp) sharedApp = await buildApp();
  return sharedApp;
}

export async function closeApp(): Promise<void> {
  if (sharedApp) {
    await sharedApp.close();
    sharedApp = null;
  }
}

export class TestWorld extends World {
  app!: FastifyInstance;
  res!: LightMyRequestResponse;
  token?: string;

  constructor(opts: IWorldOptions) {
    super(opts);
  }

  async init() {
    this.app = await getApp();
  }

  async inject(opts: InjectOptions) {
    await this.init();
    this.res = await this.app.inject(opts);
    return this.res;
  }

  bearerHeader() {
    return this.token ? { authorization: `Bearer ${this.token}` } : {};
  }
}

setWorldConstructor(TestWorld);
