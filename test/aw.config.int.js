module.exports = {
  require: ['babel-register'],
  glob: ['test/integration/**/*.spec.js'],
  mocha: {
    timeout: 5000,
  },
};
