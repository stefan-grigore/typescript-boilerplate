module.exports = {
  default: {
    require: ['features/steps/**/*.ts', 'features/support/**/*.ts'],
    requireModule: ['ts-node/register'],
    publishQuiet: true,
    format: [
      'progress',
      'json:reports/cucumber.json'
    ],
    paths: ['features/**/*.feature'],
    parallel: 0
  }
};
