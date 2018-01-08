# API Reference
## The hapi plugin
### Registration
You should register Underdog in any plugin that would like to take advantage of its features; it does not take any options.  Underdog specifies the `once` [plugin attribute](https://github.com/hapijs/hapi/blob/master/API.md#plugins), which means hapi will ensure it is not registered multiple times.

Note, Underdog utilizes an `onPreResponse` extension to finalize server-push, so if you modify the response in an `onPreResponse` extension and would like that response to push additional resources, you must specify `{ before: 'underdog' }` as an option when calling [`server.ext()`](https://github.com/hapijs/hapi/blob/master/API.md#server.ext()).

### Response toolkit decorations
#### `h.push([response], path, [headers])`
 - `response` - the hapi [response](https://github.com/hapijs/hapi/blob/master/API.md#response-object) for which you'd like to push additional resources.  Should not be an error response.  When this argument is omitted Underdog will attempt to use the request's currently set response, which will fail with an error if there is no such response.
 - `path` - the path to another resource living on the same connection as the current request that you'd like to server-push.  If the path is relative (does not begin with `/`) then it is adjusted based upon the relevant [realm's](https://github.com/hapijs/hapi/blob/master/API.md#server.realm) route prefix.
 - `headers` - any headers that you would like to add to the push-request for this resource.  By default a user-agent header is automatically added to match the user-agent of the originating request.

 Returns an object `{ response, allowed }` where `response` is the response for which resources are intended to be pushed, and `allowed` indicates whether the server-push was allowed by the client and protocol (when `false`, no resources were pushed).

 Note that when push requests are resolved credentials from the originating request will be used, and that routes marked as `isInternal` are accessible.

#### `h.pushAllowed()`
Returns `true` or `false`, indicating whether server-push is allowed by the client and protocol.  Sometimes resources cannot be pushed, for example when the server handles an http/1.1 request or when an http/2 client disables pushes.  See [ALPN Negotiation](https://nodejs.org/api/http2.html#http2_alpn_negotiation) and [HTTP/2 Session Settings](https://nodejs.org/api/http2.html#http2_settings_object) in the nodejs docs for more info.
