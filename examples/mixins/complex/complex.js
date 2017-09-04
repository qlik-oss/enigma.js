const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');
const WebSocket = require('ws');

const mixin = {
  types: ['custom-type'],

  init(args) {
    const { api } = args;
    // Create a namespace on each generated API that we can store our
    // own data on:
    api.myMixin = { pending: null, numberOfCallsToEngine: 0 };
    api.on('changed', () => {
      console.log('Mixin: Object changed, clearing cache to guarantee fresh call');
      api.myMixin.pending = null;
    });
  },
  override: {
    // We override the original 'getLayout' method with our own, introducing a
    // cache of sorts, allowing the consuming application to call 'getLayout' multiple
    // times without causing too much unnecessary websocket traffic:
    getLayout(base) {
      const clearPending = (result) => {
        console.log('Mixin: Clearing cache');
        this.myMixin.pending = null;
        // Make sure we continue to reject the promise chain if needed:
        if (result instanceof Error) {
          throw result;
        }
        return result;
      };
      if (!this.myMixin.pending) {
        this.myMixin.numberOfCallsToEngine += 1;
        console.log(`Mixin: Calling QIX Engine: ${this.myMixin.numberOfCallsToEngine}`);
        this.myMixin.pending = base().then(clearPending).catch(clearPending);
      } else {
        console.log('Mixin: Return from cache');
      }
      return this.myMixin.pending;
    },
  },
};

const session = enigma.create({
  schema,
  mixins: [mixin],
  url: 'ws://localhost:9076/app/engineData',
  createSocket: url => new WebSocket(url),
});

// Uncomment to see the websocket traffic:
// session.on('traffic:*', (direction, data) => console.log(`Traffic (${direction}):`, data));

session.open()
  .then(global => global.createSessionApp())
  .then(doc => doc.createObject({ qInfo: { qType: 'custom-type' } }))
  .then((object) => {
    object.getLayout();
    object.getLayout();
    return object.getLayout()
      // After resolving, run it one more time to see that the cache works correctly:
      .then(() => object.getLayout())
      // Once completed, we end the example:
      .then(() => session.close());
  })
  .catch((error) => {
    console.log('Something went wrong:', error);
    process.exit(1);
  });
