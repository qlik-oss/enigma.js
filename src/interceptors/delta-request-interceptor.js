const SUCCESS_KEY = 'qSuccess';

export default function deltaRequestInterceptor(session, request) {
  const delta = session.config.protocol.delta
    && request.outKey !== -1
    && request.outKey !== SUCCESS_KEY;
  if (delta) {
    request.delta = delta;
  }
  return request;
}
