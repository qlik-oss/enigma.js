module.exports = {
  require: ['babel-register'],
  glob: ['test/unit/**/*.spec.js', 'test/component/**/*.spec.js'],
  coverage: true,
  nyc: {
    reporter: ['text-lcov'],
  },
};
