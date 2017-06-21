# Global

The global API is the root API of Engine.

## Instance methods

These are some commonly used methods on the `global` instance. For a complete reference, see [Engine API: GlobalClass](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GlobalClass/Global-class.htm).

The `global` instance can be retrieved by calling `connect`:

```javascript
const enigma = require('enigma.js');

const config = {};
enigma.connect(config).then((qix) => {
  const global = qix.global;
});
```
