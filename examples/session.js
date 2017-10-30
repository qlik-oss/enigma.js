const enigma = require('enigma.js');
const WebSocket = require('ws');

const schema = require('enigma.js/schemas/12.20.0.json');

module.exports = () => enigma.create({
  schema,
  url: 'ws://frpar-veg:9076/app/engineData',
  createSocket: url => new WebSocket(url),
});
