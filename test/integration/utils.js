import WebSocket from 'ws';
import schema from '../../schemas/12.20.0.json';

function getDefaultConfig() {
  const host = 'localhost';
  const port = 9076;
  const protocol = 'ws';

  return {
    schema,
    url: `${protocol}://${host}:${port}/app/engineData/identity/${+new Date()}`,
    createSocket: url => new WebSocket(url),
  };
}

export default { getDefaultConfig };
