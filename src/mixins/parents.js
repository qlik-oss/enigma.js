export default {
  types: '*',
  init(args) {
    const { api } = args;
    if (api.openDoc) {
      // detect 'global' and store it on session:
      api.session.global = api;
    }
    if (api.getAppLayout) {
      // detect 'doc' and store it on session:
      api.session.doc = api;
    }
    const { global, doc } = api.session;
    api.global = global;
    api.doc = doc;
  },
};
