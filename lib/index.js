'use strict';

const Items = require('items');
const Stream = require('stream');
const Package = require('../package');

const internals = {};

module.exports = (server, options, next) => {

    server.decorate('reply', 'push', function (response, pushUrl) {

        if (typeof pushUrl === 'undefined') {
            pushUrl = response;
            response = this.request.response;
        }

        if (!response || response.isBoom) {
            return response;
        }

        const state = response.plugins.giver = response.plugins.giver || { pushes: [] };

        state.pushes.push(pushUrl);

        return response;
    });

    server.ext('onPreResponse', (request, reply) => {

        const response = request.response;

        const pushes = response && !response.isBoom && response.plugins.giver && response.plugins.giver.pushes;

        if (!pushes) {
            return reply.continue();
        }

        const res = (request.plugins.giver && request.plugins.giver.pushing) || request.raw.res;

        Items.parallel(pushes, (pushUrl, done) => {

            const pushRequest = {
                method: 'get',
                url: pushUrl,
                credentials: request.auth.credentials,
                plugins: { giver: { pushing: res } },
                allowInternals: true
            };

            const push = res.push(pushUrl);

            request.connection.inject(pushRequest, (pushResponse) => {

                const headers = Object.assign({}, pushResponse.headers);
                internals.deprecatedHeaders.forEach((deprecated) => delete headers[deprecated]);

                push.writeHead(pushResponse.statusCode, headers);

                const bufferStream = new Stream.PassThrough();
                bufferStream.end(pushResponse.rawPayload);
                bufferStream.pipe(push);

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

internals.deprecatedHeaders = [
    'connection',
    'host',
    'keep-alive',
    'proxy-connection',
    'transfer-encoding',
    'upgrade'
];
