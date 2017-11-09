# underdog

HTTP/2 server-push for hapi

[![Build Status](https://travis-ci.org/devinivy/underdog.svg?branch=master)](https://travis-ci.org/devinivy/underdog) [![Coverage Status](https://coveralls.io/repos/devinivy/underdog/badge.svg?branch=master&service=github)](https://coveralls.io/github/devinivy/underdog?branch=master)

Lead Maintainer - [Devin Ivy](https://github.com/devinivy)

## Usage
> See also the [API Reference](API.md)

Underdog brings [HTTP/2 server-push](http://httpwg.org/specs/rfc7540.html#PushResources) to hapijs.  The way it works is that you specify paths to resources on the same connection as the current request that you'd like to push alongside a particular response.  This is achieved with a call to the reply decoration [`reply.push()`](#replypushresponse-path-headers).  Before hapi responds to the original request, those push-requests will be made internally and their results will be streamed to the client as push-responses.  Even pushed resources can specify additional resources to push.  You can't make this stuff up!

### Example
```js
const Fs = require('fs');
const Hapi = require('hapi');
const Http2 = require('http2'); // Or use node-spdy with h2
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
            path: '/',
            handler: (request, reply) => {

                const response = reply('<script src="/push-me.js"></script>');

                reply.push(response, 'push-me.js');
            }
        },
        {
            method: 'get',
            path: '/push-me.js',
            handler: (request, reply) => {

                reply('document.write(\'I was definitely pushed!\');');                
            },
            // To demonstrate that it must have been pushed, not requested directly
            config: { isInternal: true }
        }
    ]);

    server.start((err) => {

        if (err) {
            throw err;
        }

        console.log(`Check-out ${server.info.uri} in your favorite HTTP/2-supporting client`);
    });
});
```

### Compatibility
To use Underdog your hapi [connections](http://hapijs.com/api#serverconnectionoptions) must be provided a `listener` adherent to the HTTP/2 protocol.  Currently Underdog is compatible with HTTP/2 listeners created with versions ≥3.4.0 and <4 of [node-spdy](https://github.com/indutny/node-spdy) and 3.x.x of [node-http2](https://github.com/molnarg/node-http2).
