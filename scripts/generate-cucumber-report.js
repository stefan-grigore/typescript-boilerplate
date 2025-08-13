// scripts/generate-cucumber-report.js
const fs = require('fs');
const path = require('path');
const reporter = require('cucumber-html-reporter');

const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const options = {
  theme: 'bootstrap',
  jsonFile: path.join(reportsDir, 'cucumber.json'),
  output: path.join(reportsDir, 'cucumber.html'),
  reportSuiteAsScenarios: true,
  launchReport: false,
  metadata: {
    Platform: process.platform,
    Node: process.version,
  },
};

reporter.generate(options);
console.log('✅ HTML report:', options.output);
