# Mixins

The *mixin* concept allows you to add or overwrite Qlik Engine API functionality. A mixin is basically a JavaScript object, or a
function, that returns a JavaScript object containing functions that are applied to an API of a specified type.

Generic types like for example `GenericObject`, `Doc`, `GenericBookmark`, are supported but also custom GenericObject types such as `barchart`, `story` and `myCustomType`. 

Mixins that are bound to several different types can find the current object type in the `customType` or `type` members of the object. `this.type` would for instance return `GenericObject` and this.customType would return `barchart`   



```javascript
const appMixin = {
	/**
	* An array of strings specifying which api types this mixin applies to. It works with a single
	* string as well.
	*/
	types: ["Doc"], // An app has the typename "Doc" which is a QlikView legacy name.

	/**
	 * Initialization function. Called when an instance of the specified API(s) is created
	 * before applying the mixins.
	 * @param {Object} args - Object containing init parameters.
	 * @param {Function} args.Promise - The promise library that was used when setting up 
	 * the qix service
	 * @param {Object} args.api - The object instance that was just created.
	 */
	init: ( args ) => {
		// Any initialization code goes here.
	},

	/**
	 * Object literal containing methods that will be added to the API.
	 * Already existing functions with the same name cannot be overridden.
	 */
	extend: {
		/**
		 * Simple tweeting function.
		 */
		tweet: () => {
			console.log( "This app is tweeting ");
		},

		/**
		 * This function already exist on the app API and will therefore cause an exception when creating
		 * the API.
		 */
		getObject: () => {
			console.log( "trying to override but it won't work" );
		}
	},

	/**
	 * Object literal containing methods that will be overwritten to already existing API methods.
	 * An error is thrown if any of the specified methods does not exist.
	 */
	override: {
		/**
		 * Overriding the getObject function.
		 * @param {Function} _getObject - This is the original function that is being overridden.
		 * Can be used in the override.
		 * @param {String} id - Parameter from the original function.
		 * @returns {Promise<Object|null>} A promise that when resolved contains the object asked
		 * for or null if object doesn't exist.
		 */
		getObject: ( _getObject, id ) => {
			// e.g. get object from cache, if exist and return a resolved promise. Else do this
			return _getObject( id );
		}
	}
};
```

If the object in the example above is used in the mixin array for the QIX service configuration object, the framework
intercepts each object-API of type `Doc` and adds the method `tweet()` on the object that is returned. So the app objects in the examples in [Using enigma.js](configuration.md) can then do `app.tweet()`.

This is useful for adding sugar methods to the Qlik Engine API. A method like for example `createSheet` might be convenient.

```javascript
const appMixin = {
	types: "Doc",
	extend: {
		/**
		 * Creates a Qlik Sense Sheet
		 * @param {String} [title] - Title of the new sheet.
		 * @param {String} [description] - Description of the new sheet.
		 * @param {String} [thumbnail] - URL to a thumbnail image.
		 * @returns {Promise<Object,Error>} A Promise that returns an API to the new sheet if
		 * resolved or an Error if rejected.
		 */
		createSheet: function( title, description, thumbnail ) {
			return this.createObject( {
				qInfo: {
					qType: "sheet"
				},
				qMetaDef: {
					title: title || "",
					description: description || ""
				},
				rank: -1,
				thumbnail: { qStaticContentUrlDef: thumbnail || null },
				columns: 24,
				rows: 12,
				cells: [],
				qChildListDef: {
					qData: {
						"title": "/title"
					}
				}
			} );
		}
	}
}
```

Now your app object can create Qlik Sense compatible sheets.
