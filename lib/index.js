'use strict';

const Items = require('items');
const Hoek = require('hoek');
const Stream = require('stream');
const Package = require('../package');

const internals = {};

module.exports = (server, options, next) => {

    server.decorate('reply', 'push', function (response, path, headers) {

        if (typeof response === 'string') {
            headers = path;
            path = response;
            response = this.request.response;
        }

        Hoek.assert(response && !response.isBoom, 'Must server-push with a non-error response.');

        headers = headers || {};

        const state = internals.getState(response);
        state.pushes = state.pushes || [];
        state.pushes.push({ path, headers });

        return response;
    });

    // Handle requests for pushed resources

    server.ext('onPreResponse', (request, reply) => {

        const state = internals.getState(request);

        if (!state.pushing) {
            return reply.continue();
        }

        const readableRes = new Stream.PassThrough();
        state.readableRes = readableRes;
        request.response.on('peek', (chk, enc) => readableRes.write(chk, enc));
        request.response.on('finish', () => readableRes.end());

        reply.continue();
    });

    // Handle requests trying to push additional resources

    server.ext('onPreResponse', (request, reply) => {

        const response = request.response;
        const pushes = !response.isBoom && internals.getState(response).pushes;

        if (!pushes) {
            return reply.continue();
        }

        const state = internals.getState(request);
        const res = state.pushing || request.raw.res;
        const userAgent = { 'user-agent': request.headers['user-agent'] };

        Items.parallel(pushes, (push, done) => {

            const injectedReq = {
                method: 'get', // The head method is allowed, but perhaps not practical
                url: push.path,
                headers: Hoek.applyToDefaults(userAgent, push.headers),
                credentials: request.auth.credentials,
                plugins: { underdog: { pushing: res } },
                allowInternals: true
            };

            request.connection.inject(injectedReq, (pushResponse) => {

                const reqHeaders = Hoek.shallow(pushResponse.raw.req.headers);
                delete reqHeaders.host; // Let http2 handle setting this

                // Remove deprecated response headers

                const resHeaders = Hoek.shallow(pushResponse.headers);

                for (let i = 0; i < internals.deprecatedHeaders.length; ++i) {
                    const deprecated = internals.deprecatedHeaders[i];
                    delete resHeaders[deprecated];
                }

                // Stream the pushed response

                const pusher = res.push({ headers: reqHeaders, path: push.path });

                pusher.writeHead(pushResponse.statusCode, resHeaders);
                internals.getState(pushResponse.request).readableRes.pipe(pusher);

                done();
            });
        },
        () => {

            return reply.continue();
        });
    });

    next();
};

module.exports.attributes = {
    pkg: Package,
    once: true
};

// Receives request or non-error response
internals.getState = (x) => {

    if (!x.plugins.underdog) {
        x.plugins.underdog = {};
    }

    return x.plugins.underdog;
};

internals.deprecatedHeaders = [
    'connection',
    'host',
    'keep-alive',
    'proxy-connection',
    'transfer-encoding',
    'upgrade'
];
