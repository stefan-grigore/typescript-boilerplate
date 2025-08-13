import { AfterAll, Before } from '@cucumber/cucumber';
import { TestWorld } from '../steps/world';
import { closeApp } from '../steps/world';

Before(async function (this: TestWorld) {
  await this.init();
});

AfterAll(async function () {
  await closeApp();
});
