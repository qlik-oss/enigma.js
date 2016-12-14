# Bookmarks

Bookmarks are used to store selection states or particular locations within an app. They can later be used to restore selections to a former state.


## Instance methods

The bookmark instance has methods that can mainly be used to work with selections regarding that bookmark.

To retrieve a bookmark, you call the `getBookmark` method on the [app](apps.md).

```javascript
app.getBookmark( "bookmarkId" ).then( ( bookmark ) => {
    // Continue working with the bookmark instance
} );
```

This is a selection of commonly used methods, you can find a complete list in the Engine API reference.

**Engine API reference**
- Class: [GenericBookmark](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Classes/GenericBookmarkClass/GenericBookmark-class.htm)
- Struct: [GenericBookmarkLayout](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericBookmarkLayout.htm)
- Struct: [GenericBookmarkProperties](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/GenericBookmarkProperties.htm)



### `bookmark.getLayout()`

Evaluates the bookmark and displays its properties, including the dynamic properties.

```javascript
bookmark.getLayout().then( ( layout ) => {
    // Got the layout
} );
```


### `bookmark.getProperties()`

Returns the properties of a bookmark.

```javascript
bookmark.getProperties().then( ( properties ) => {
    // Got the properties
} );
```


### `bookmark.setProperties()`

Sets properties for a bookmark.

```javascript
bookmark.setProperties( properties ).then( ( properties ) => {
    // Properties was set
} );
```


## Listing bookmarks

Listing bookmarks is done by creating a session object on the app.

```javascript
app.createSessionObject( {
    qBookmarkListDef: {},
    qInfo: {
        qId: "BookmarkList",
        qType: "BookmarkList"
    }
} ).then( ( list ) => {
    return list.getLayout();
} ).then( ( listLayout ) => {
    return listLayout.qBookmarkList.qItems;
} ).then( ( bookmarkItems ) => {
   // Got the bookmark list
} );
```

**Engine API reference**
- Struct: [BookmarkListDef](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/BookmarkListDef.htm)
- Struct: [BookmarkList](https://help.qlik.com/en-US/sense-developer/Subsystems/EngineAPI/Content/Structs/BookmarkList.htm)


## Related methods

The following methods are available on the [app](apps.md):

### `app.createBookmark( id )`

- `id` - String - Identifier of the bookmark.

Creates a bookmark.

```javascript
app.createBookmark( bookmarkProperties ).then( ( layout ) => {
    console.log( layout.myprop );
} );
```


### `app.getBookmark( id )`

- `id` - String - Identifier of the bookmark.

Returns the handle of a bookmark.

```javascript
app.getBookmark( id ).then( ( bookmark ) => {
    // Got the bookmark instance
} );
```


### `app.applyBookmark( id )`

- `id` - String - Identifier of the bookmark.

Applies a bookmark.

```javascript
app.applyBookmark( id ).then( ( layout ) => {
    console.log( layout.myprop );
} );
```


### `app.destroyBookmark( id )`

- `id` - String - Identifier of the bookmark.

Removes a bookmark.

```javascript
app.destroyBookmark( id ).then( ( layout ) => {
    // Bookmark was destroyed
} );
```
