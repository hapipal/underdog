# underdog
HTTP/2 server-push for hapi

[![Build Status](https://travis-ci.org/devinivy/underdog.svg?branch=master)](https://travis-ci.org/devinivy/underdog) [![Coverage Status](https://coveralls.io/repos/devinivy/underdog/badge.svg?branch=master&service=github)](https://coveralls.io/github/devinivy/underdog?branch=master)

Lead Maintainer - [Devin Ivy](https://github.com/devinivy)

## Usage
> See also the [API Reference](API.md)

Underdog brings [HTTP/2 server-push](http://httpwg.org/specs/rfc7540.html#PushResources) to **hapi v17+**.  The way it works is that you specify paths to resources that you'd like to push alongside a particular response.  This is achieved with a call to the response toolkit decoration [`h.push()`](API.md#hpushresponse-path-headers).  Before hapi responds to the original request, those push-requests will be made internally and their results will be streamed to the client as push-responses.  Even pushed resources can specify additional resources to push.  You can't make this stuff up!

> **Note**
>
> Under hapi v16 `server.connection({ listener })` must be used rather than `server.connection({ listener, tls: true })`.  This is due to a minor discrepancy between how the node-http2 and node-spdy modules emit new connections compared to a standard node https server.  See [hapijs/hapi#2362](https://github.com/hapijs/hapi/pull/2362) for more info.  The main downside of this is that hapi's `server.info.protocol` incorrectly reports `'http'` rather than `'https'`.

### Example
```js
const Fs = require('fs');
const Http2 = require('http2');
const Hapi = require('hapi');
const Underdog = require('underdog');

(async () => {

    const listener = Http2.createSecureServer({
        // See tests for a key/cert that you can use to try this out
        key: Fs.readFileSync(`${__dirname}/localhost.key`),
        cert: Fs.readFileSync(`${__dirname}/localhost.cert`)
    });

    const server = Hapi.server({
        listener,
        tls: true,
        port: 3000
    });

    await server.register(Underdog);

    server.route([
        {
            method: 'get',
            path: '/',
            handler: (request, h) => {

                const response = h.response('<script src="/push-me.js"></script>');

                h.push(response, 'push-me.js');

                return response;
            }
        },
        {
            method: 'get',
            path: '/push-me.js',
            handler: (request) => {

                return 'document.write(\'I was definitely pushed!\');';                
            },
            // To demonstrate that it must have been pushed, not requested directly
            config: { isInternal: true }
        }
    ]);

    await server.start();

    console.log(`Check-out ${server.info.uri} in your favorite HTTP/2-supporting client`);
})();
```

### Compatibility
Underdog is compatible with nodejs's [`Http2Server`](https://nodejs.org/api/http2.html#http2_http2_createserver_options_onrequesthandler) and [`Http2SecureServer`](https://nodejs.org/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler) under the [Compatibility API](https://nodejs.org/api/http2.html#http2_compatibility_api).  Using any other HTTP server will simply disable server-push; [`h.push()`](API.md#hpushresponse-path-headers) will no-op and return `{ response, allowed: false }` and [`h.pushAllowed()`](API.md#hpushallowed) will return `false`.

## Extras
 - The HTTP/2 spec ([here](http://httpwg.org/specs/rfc7540.html))
 - For debugging HTTP/2 in Chrome, see `chrome://net-internals/#http2`
 - Nodejs's HTTP/2 docs ([here](https://nodejs.org/api/http2.html))
 - Shout-out to the original userland [spdy](https://github.com/indutny/node-spdy) and  [http2](https://github.com/molnarg/node-http2) modules.
