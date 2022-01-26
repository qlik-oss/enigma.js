const enigma = require('enigma.js');
const WebSocket = require('ws');
const dotenv = require('dotenv');

dotenv.config();

const schema = require('enigma.js/schemas/12.20.0.json');

module.exports = () => enigma.create({
  schema,
  url: `wss://${process.env.QCS_HOST}/app/SessionApp_1234`,
  createSocket: (url) => new WebSocket(url, {
    headers: { Authorization: `Bearer ${process.env.QCS_API_KEY}` },
  }),
});
