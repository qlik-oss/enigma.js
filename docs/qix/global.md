# Global

The global API is the root API of Engine.

## Instance methods

These are some commonly used methods on the `global` instance. For a complete reference, see [Engine API: GlobalClass](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GlobalClass/Global-class.htm).

The `global` instance can be retrieved by calling `session.open()`:

```javascript
const enigma = require('enigma.js');

const config = {};
enigma.create(config).open().then((g) => {
  const global = g;
});
```
