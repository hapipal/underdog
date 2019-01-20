'use strict';

const Hoek = require('hoek');
const Stream = require('stream');
const Package = require('../package');

const internals = {};

module.exports = {
    pkg: Package,
    once: true,
    register(server) {

        server.decorate('toolkit', 'pushAllowed', function () {

            const state = internals.getState(this.request);
            const req = state.req || this.request.raw.req;

            return !!(req.stream && req.stream.pushAllowed);
        });

        server.decorate('toolkit', 'push', function (response, paths, headers) {

            Hoek.assert(response, 'Must provide a path to the resource to be pushed.');

            if (typeof response !== 'object') {
                headers = paths;
                paths = response;
                response = this.request.response;
            }

            Hoek.assert(response && !response.isBoom, 'Must server-push with a non-error response.');
            Hoek.assert(paths, 'Must provide a path to the resource to be pushed.');

            const allowed = this.pushAllowed();

            if (!allowed) {
                return { response, allowed };
            }

            // Normalize paths to an array

            if (!Array.isArray(paths)) {
                paths = [paths];
            }

            headers = headers || {};

            const state = internals.getState(response);
            state.pushes = state.pushes || [];

            // Adjust for relative paths

            for (let i = 0; i < paths.length; ++i) {
                let path = paths[i];
                path = (path[0] === '/') ? path : `${this.realm.modifiers.route.prefix || ''}/${path}`;
                state.pushes.push({ path, headers });
            }

            return { response, allowed };
        });

        // Handle requests for pushed resources

        server.ext('onPreResponse', (request, h) => {

            const state = internals.getState(request);

            if (!state.pushing) {
                return h.continue;
            }

            const readableRes = new Stream.PassThrough();
            state.readableRes = readableRes;
            request.response.events.on('peek', (chk, enc) => readableRes.write(chk, enc));
            request.response.events.on('finish', () => readableRes.end());

            return h.continue;
        });

        // Handle requests trying to push additional resources

        server.ext('onPreResponse', async (request, h) => {

            const { response } = request;
            const pushes = !response.isBoom && internals.getState(response).pushes;

            if (!pushes) {
                return h.continue;
            }

            const state = internals.getState(request);
            const res = state.res || request.raw.res;
            const req = state.req || request.raw.req;
            const userAgent = { 'user-agent': request.headers['user-agent'] };
            const respond = async (push) => {

                const pushResponse = await request.server.inject({
                    method: 'get', // The head method is allowed, but perhaps not practical
                    url: push.path,
                    headers: Hoek.applyToDefaults(userAgent, push.headers),
                    auth: !request.auth.isAuthenticated ? undefined : {
                        credentials: request.auth.credentials,
                        artifacts: request.auth.artifacts,
                        strategy: request.auth.strategy
                    },
                    plugins: { underdog: { req, res, pushing: true } },
                    allowInternals: true
                });

                // Remove deprecated headers

                const reqHeaders = Object.assign({}, pushResponse.raw.req.headers);
                const resHeaders = Object.assign({}, pushResponse.headers);

                for (let i = 0; i < internals.deprecatedHeaders.length; ++i) {
                    const deprecated = internals.deprecatedHeaders[i];
                    delete reqHeaders[deprecated];
                    delete resHeaders[deprecated];
                }

                // Stream the pushed response

                const pusher = await internals.getPushStream(res, {
                    ...reqHeaders,
                    ':path': push.path
                });

                pusher.respond({
                    ...resHeaders,
                    ':status': pushResponse.statusCode
                });

                internals.getState(pushResponse.request).readableRes.pipe(pusher);
            };

            await Promise.all(pushes.map(respond));

            return h.continue;
        });
    }
};

// Receives request or non-error response

internals.getState = (x) => {

    if (!x.plugins.underdog) {
        x.plugins.underdog = {};
    }

    return x.plugins.underdog;
};

internals.getPushStream = (res, headers) => {

    return new Promise((resolve, reject) => {

        res.stream.pushStream(headers, (err, stream) => {
            // In node v9.4.0 this callback became error-first

            if (err instanceof Error) {
                return reject(err);
            }

            return resolve(err || stream);
        });
    });
};

internals.deprecatedHeaders = [
    'connection',           // req, res
    'host',                 // req; should be set as :authority, by underlying http2 lib
    'keep-alive',           // req, res
    'proxy-connection',     // req
    'transfer-encoding',    // res
    'upgrade'               // req, res
];
