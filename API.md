## API
### The plugin
You should register Underdog in any plugin that would like to take advantage of its features; it does not take any options.  Underdog specifies the `once` [plugin attribute](http://hapijs.com/api#plugins), which means hapi will ensure it is not registered multiple times to the same connection.

Note, Underdog utilizes an `onPreResponse` extension to finalize server-push, so if you modify the response in an `onPreResponse` extension and would like that response to push additional resources, you must specify `{ before: 'underdog' }` as an option when calling [`server.ext()`](http://hapijs.com/api#serverextevent-method-options).

### `reply.push([response], path, [headers])`
 - `response` - the hapi [response](http://hapijs.com/api#response-object) for which you'd like to push additional resources.  Should not be an error response.  When this argument is omitted Underdog will attempt to use the request's currently set response, which will fail with an error if there is no such response.
 - `path` - the path to another resource living on the same connection as the current request that you'd like to server-push, or an array of such paths.  If the path is relative (does not begin with `/`) then it is adjusted based upon the relevant [realm's](http://hapijs.com/api#serverrealm) route prefix.
 - `headers` - any headers that you would like to add to the push-request for this resource.  By default a user-agent header is automatically added to match the user-agent of the originating request.

 Note that when push-requests are resolved credentials from the originating request will be used, and that routes marked as `isInternal` are accessible.

## Extras
 - The HTTP/2 spec ([here](http://httpwg.org/specs/rfc7540.html))
 - The `http2` node module ([here](https://github.com/molnarg/node-http2))
 - The `spdy` (also implementing HTTP/2) node module ([here](https://github.com/indutny/node-spdy))
 - For debugging HTTP/2 in Chrome, see `chrome://net-internals/#http2`
