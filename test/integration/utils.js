import dotenv from 'dotenv';
import crypto from 'crypto';
import WebSocket from 'ws';
import schema from '../../schemas/12.170.2.json';

dotenv.config();

function getDefaultConfig(ttl = false) {
  const host = process.env.QCS_HOST;
  const protocol = 'wss';
  const randomId = crypto.randomBytes(20).toString('hex');
  const ttlPath = ttl ? `/ttl/${ttl}` : '';
  return {
    schema,
    url: `${protocol}://${host}/app/SessionApp_${randomId}${ttlPath}`,
    createSocket: (url) => new WebSocket(url, {
      headers: { Authorization: `Bearer ${process.env.QCS_API_KEY}` },
    }),
  };
}

export default { getDefaultConfig };
