module.exports = process.env.AK_MODEL_TEST_COVERAGE ? require('./lib-cov/model') : require('./lib/model');
