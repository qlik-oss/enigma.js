module.exports = {
  fromJsdoc: {
    glob: ['./src/**/*.js'],
    package: './package.json',
    api: {
      name: 'enigma.js',
      stability: 'stable',
      properties: {
        'x-qlik-visibility': 'public',
        'x-qlik-stability': 'stable',
      },
    },
    parse: {
      rules: {
        'no-default-exports-wo-name': 0,
      },
    },
    output: {
      file: './docs/api-spec.json',
    },
  },
};
