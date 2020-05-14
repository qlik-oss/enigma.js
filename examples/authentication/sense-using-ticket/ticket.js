const axios = require('axios');
const enigma = require('enigma.js');
const WebSocket = require('ws');

const schema = require('enigma.js/schemas/12.20.0.json');
const config = require('./config');

let possibleEnigmaErr;

(async () => {
  // Retrieve the requestTicket
  const { data } = await axios.post(config.ticketURL(), config.ticketReqBody(), config.ticketReqConfig);

  // Create a enigma session
  const session = enigma.create({
    schema,
    url: `https://${config.host}${config.virtualProxy}/app/${config.appId}?QlikTicket=${data.Ticket}`,
    createSocket: (url) => new WebSocket(url, {
      headers: {
        'X-Qlik-User': `UserDirectory=${encodeURIComponent(config.userDirectory)}; UserId=${encodeURIComponent(config.userId)}`,
      },
    }),
  });
  
  // Catch possible errors sent on WebSocket
  session.on('traffic:received', (res) => {
    if (res.params && res.params.severity === 'fatal'){
      possibleEnigmaErr = res.params.message;
    }
  });

  console.log(`Connecting to ${session.config.url}`);

  // Connect to the engine and retrieve the global
  const global = await session.open();
  // Get the doc/app list for the configured user
  const list = await global.getDocList();
  const apps = list.map((app) => `\n\t${app.qDocId} (${app.qTitle || 'No title'})`).join(', ');
  console.log(`\nApps on this Engine that the configured user can open: ${apps}`);
  session.close();

})().catch(err => {
  if (err.enigmaError) {
    console.error('Enigma error:', possibleEnigmaErr || err);
  } else {
    console.log(err);
  }
});








