# underdog

HTTP/2 server-push for hapi

[![Build Status](https://travis-ci.org/devinivy/underdog.svg?branch=master)](https://travis-ci.org/devinivy/underdog) [![Coverage Status](https://coveralls.io/repos/devinivy/underdog/badge.svg?branch=master&service=github)](https://coveralls.io/github/devinivy/underdog?branch=master)

## Usage
Underdog brings [HTTP/2 server-push](http://httpwg.org/specs/rfc7540.html#PushResources) to hapijs.  The way it works is that you specify paths to resources on the same connection as the current request that you'd like to push alongside a particular response.  This is achieved with a call to the reply decoration `reply.push()`.  Before hapi responds to the original request, those push-requests will be made internally and their results will be streamed to the client as push-responses.  Even pushed resources can specify additional resources to push.  You can't make this stuff up!

### Example
```js
const Fs = require('fs');
const Hapi = require('hapi');
const Http2 = require('http2');
const Underdog = require('underdog');

const listener = Http2.createServer({
    // See tests for a key/cert that you can use to try this out
    key: Fs.readFileSync(`${__dirname}/localhost.key`),
    cert: Fs.readFileSync(`${__dirname}/localhost.cert`)
});

const server = new Hapi.Server();
server.connection({ listener, tls: true, port: 3000 });

server.register(Underdog, (err) => {

    if (err) {
        throw err;
    }

    server.route([
        {
            method: 'get',
            url: '/',
            handler: (request, reply) => {

                const response = reply('<script src="/push-me.js"></script>');

                reply.push(response, '/push-me.js');
            }
        },
        {
            method: 'get',
            url: '/push-me.js',
            handler: (request, reply) => {

                reply('document.write(\'I was definitely pushed!\');');                
            },
            // So that we know that it must have been pushed, not requested directly
            config: { isInternal: true }
        }
    ]);

    server.start((err) => {

        if (err) {
            throw err;
        }

        console.log(`Check-out ${server.info.uri} in Chrome`);
    });
});
```

## API
### The plugin
You should register Underdog in any plugin that would like to take advantage of its features; it does not take any options.  Underdog specifies the `once` plugin attribute, which means hapi will ensure it is not registered multiple times to the same connection.

Note, Underdog utilizes an `onPreResponse` extension to finalize server-push, so if you modify the response in an `onPreResponse` extension and would like that response to push additional resources, you must specify `{ before: 'underdog' }` as an option when calling `server.ext()`.

### `reply.push([response], path, [headers])`
 - `response` - the hapi [response]() for which you'd like to push additional resources.  Should not be an error response.  When this argument is omitted Underdog will attempt to use the request's currently set response, which will fail with an error if there is no such response.
 - `path` - the path to another resource living on the same connection as the current request that you'd like to server-push.  If the path is relative (does not begin with `/`) then it is adjusted based upon the relevant realm's route prefix.
 - `headers` - any headers that you would like to add to the push-request for this resource.  By default a user-agent header is automatically added to match the user-agent of the originating request.

 Note that when push-requests are resolved credentials from the originating request will be used, and that they may hit routes marked as `isInternal`.
