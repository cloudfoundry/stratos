const createReporter = require('istanbul-api').createReporter;
const istanbulCoverage = require('istanbul-lib-coverage');
const coverage = require('../coverage/coverage-final.json');

const map = istanbulCoverage.createCoverageMap();
Object.keys(coverage).forEach(filename => map.addFileCoverage(coverage[filename]));

const reporter = createReporter();
reporter.addAll(['html', 'lcovonly', 'json']);
reporter.write(map);
