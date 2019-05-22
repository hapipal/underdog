'use strict';

// Load modules

const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const Toys = require('toys');
const Http = require('http');
const Https = require('https');
const Http2 = require('http2');
const Underdog = require('..');

// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Underdog', () => {

    const creds = {
        key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0UqyXDCqWDKpoNQQK/fdr0OkG4gW6DUafxdufH9GmkX/zoKz\ng/SFLrPipzSGINKWtyMvo7mPjXqqVgE10LDI3VFV8IR6fnART+AF8CW5HMBPGt/s\nfQW4W4puvBHkBxWSW1EvbecgNEIS9hTGvHXkFzm4xJ2e9DHp2xoVAjREC73B7JbF\nhc5ZGGchKw+CFmAiNysU0DmBgQcac0eg2pWoT+YGmTeQj6sRXO67n2xy/hA1DuN6\nA4WBK3wM3O4BnTG0dNbWUEbe7yAbV5gEyq57GhJIeYxRvveVDaX90LoAqM4cUH06\n6rciON0UbDHV2LP/JaH5jzBjUyCnKLLo5snlbwIDAQABAoIBAQDJm7YC3pJJUcxb\nc8x8PlHbUkJUjxzZ5MW4Zb71yLkfRYzsxrTcyQA+g+QzA4KtPY8XrZpnkgm51M8e\n+B16AcIMiBxMC6HgCF503i16LyyJiKrrDYfGy2rTK6AOJQHO3TXWJ3eT3BAGpxuS\n12K2Cq6EvQLCy79iJm7Ks+5G6EggMZPfCVdEhffRm2Epl4T7LpIAqWiUDcDfS05n\nNNfAGxxvALPn+D+kzcSF6hpmCVrFVTf9ouhvnr+0DpIIVPwSK/REAF3Ux5SQvFuL\njPmh3bGwfRtcC5d21QNrHdoBVSN2UBLmbHUpBUcOBI8FyivAWJhRfKnhTvXMFG8L\nwaXB51IZAoGBAP/E3uz6zCyN7l2j09wmbyNOi1AKvr1WSmuBJveITouwblnRSdvc\nsYm4YYE0Vb94AG4n7JIfZLKtTN0xvnCo8tYjrdwMJyGfEfMGCQQ9MpOBXAkVVZvP\ne2k4zHNNsfvSc38UNSt7K0HkVuH5BkRBQeskcsyMeu0qK4wQwdtiCoBDAoGBANF7\nFMppYxSW4ir7Jvkh0P8bP/Z7AtaSmkX7iMmUYT+gMFB5EKqFTQjNQgSJxS/uHVDE\nSC5co8WGHnRk7YH2Pp+Ty1fHfXNWyoOOzNEWvg6CFeMHW2o+/qZd4Z5Fep6qCLaa\nFvzWWC2S5YslEaaP8DQ74aAX4o+/TECrxi0z2lllAoGAdRB6qCSyRsI/k4Rkd6Lv\nw00z3lLMsoRIU6QtXaZ5rN335Awyrfr5F3vYxPZbOOOH7uM/GDJeOJmxUJxv+cia\nPQDflpPJZU4VPRJKFjKcb38JzO6C3Gm+po5kpXGuQQA19LgfDeO2DNaiHZOJFrx3\nm1R3Zr/1k491lwokcHETNVkCgYBPLjrZl6Q/8BhlLrG4kbOx+dbfj/euq5NsyHsX\n1uI7bo1Una5TBjfsD8nYdUr3pwWltcui2pl83Ak+7bdo3G8nWnIOJ/WfVzsNJzj7\n/6CvUzR6sBk5u739nJbfgFutBZBtlSkDQPHrqA7j3Ysibl3ZIJlULjMRKrnj6Ans\npCDwkQKBgQCM7gu3p7veYwCZaxqDMz5/GGFUB1My7sK0hcT7/oH61yw3O8pOekee\nuctI1R3NOudn1cs5TAy/aypgLDYTUGQTiBRILeMiZnOrvQQB9cEf7TFgDoRNCcDs\nV/ZWiegVB/WY7H0BkCekuq5bHwjgtJTpvHGqQ9YD7RhE8RSYOhdQ/Q==\n-----END RSA PRIVATE KEY-----\n',
        cert: '-----BEGIN CERTIFICATE-----\nMIIDBjCCAe4CCQDvLNml6smHlTANBgkqhkiG9w0BAQUFADBFMQswCQYDVQQGEwJV\nUzETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0\ncyBQdHkgTHRkMB4XDTE0MDEyNTIxMjIxOFoXDTE1MDEyNTIxMjIxOFowRTELMAkG\nA1UEBhMCVVMxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0\nIFdpZGdpdHMgUHR5IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\nANFKslwwqlgyqaDUECv33a9DpBuIFug1Gn8Xbnx/RppF/86Cs4P0hS6z4qc0hiDS\nlrcjL6O5j416qlYBNdCwyN1RVfCEen5wEU/gBfAluRzATxrf7H0FuFuKbrwR5AcV\nkltRL23nIDRCEvYUxrx15Bc5uMSdnvQx6dsaFQI0RAu9weyWxYXOWRhnISsPghZg\nIjcrFNA5gYEHGnNHoNqVqE/mBpk3kI+rEVzuu59scv4QNQ7jegOFgSt8DNzuAZ0x\ntHTW1lBG3u8gG1eYBMquexoSSHmMUb73lQ2l/dC6AKjOHFB9Ouq3IjjdFGwx1diz\n/yWh+Y8wY1Mgpyiy6ObJ5W8CAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAoSc6Skb4\ng1e0ZqPKXBV2qbx7hlqIyYpubCl1rDiEdVzqYYZEwmst36fJRRrVaFuAM/1DYAmT\nWMhU+yTfA+vCS4tql9b9zUhPw/IDHpBDWyR01spoZFBF/hE1MGNpCSXXsAbmCiVf\naxrIgR2DNketbDxkQx671KwF1+1JOMo9ffXp+OhuRo5NaGIxhTsZ+f/MA4y084Aj\nDI39av50sTRTWWShlN+J7PtdQVA5SZD97oYbeUeL7gI18kAJww9eUdmT0nEjcwKs\nxsQT1fyKbo7AlZBY4KSlUMuGnn0VnAsB9b+LxtXlDfnjyM8bVQx1uAfRo0DO8p/5\n3J5DTjAU55deBQ==\n-----END CERTIFICATE-----\n'
    };

    const makeServer = async (routes) => {

        const server = Hapi.server({
            debug: false,
            listener: Http2.createSecureServer(creds),
            tls: true
        });

        await server.register(Underdog);

        if (routes) {
            server.route(routes);
        }

        await server.start();

        const client = Http2.connect(server.info.uri, { rejectUnauthorized: false });

        return { server, client };
    };

    const expectToStream = async (stream, expectedContent) => {

        let content = '';

        stream.on('data', (data) => {

            content += data.toString();
        });

        await Toys.stream(stream);

        expect(content).to.equal(expectedContent);
    };

    const getPushes = async (client, count = 1) => {

        const pushes = [];

        for (let i = 0; i < count; ++i) {
            const [pushed, reqHeaders] = await Toys.event(client, 'stream', { multiple: true });
            pushes.push([pushed, reqHeaders, Toys.event(pushed, 'push')]);
        }

        return await Promise.all(
            pushes.map((push) => Promise.all(push))
        );
    };

    it('pushes complete resource for an explicitly specified response.', { plan: 9 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');
                    const result = h.push(response, '/push-me');

                    expect(result).to.only.contain(['allowed', 'response']);
                    expect(result.allowed).to.equal(true);
                    expect(result.response).to.shallow.equal(response);

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, h) => {

                    return h.response('pushed').header('x-custom', 'winnie').code(201);
                }
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(pushResHeaders[':status']).to.equal(201);
        expect(pushResHeaders['x-custom']).to.equal('winnie');

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('pushes resource for the request\'s current response.', { plan: 7 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request) => 'body',
                options: {
                    ext: {
                        onPostHandler: {
                            method: (request, h) => {

                                const result = h.push('/push-me');
                                expect(result.allowed).to.equal(true);
                                expect(result.response).to.shallow.equal(request.response);

                                return h.continue;
                            }
                        }
                    }
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(pushResHeaders[':status']).to.equal(200);

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('pushes resources from internal routes.', { plan: 5 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');
                    h.push(response, '/push-me');

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed',
                config: { isInternal: true }
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(pushResHeaders[':status']).to.equal(200);

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('pushes multiple resources.', { plan: 8 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');
                    h.push(response, '/push-me');
                    h.push(response, '/push-me-again');

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            },
            {
                method: 'get',
                path: '/push-me-again',
                handler: (request) => 'pushed again'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [
                [pushed1, push1ReqHeaders, push1ResHeaders],
                [pushed2, push2ReqHeaders, push2ResHeaders]
            ]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client, 2)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(push1ReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(push2ReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me-again',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(push1ResHeaders[':status']).to.equal(200);
        expect(push2ResHeaders[':status']).to.equal(200);

        await Promise.all([
            expectToStream(request, 'body'),
            expectToStream(pushed1, 'pushed'),
            expectToStream(pushed2, 'pushed again')
        ]);
    });

    it('pushes multiple resources with an array of paths.', { plan: 8 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');

                    h.push(response, [
                        '/push-me',
                        '/push-me-again'
                    ]);

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            },
            {
                method: 'get',
                path: '/push-me-again',
                handler: (request) => 'pushed again'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [
                [pushed1, push1ReqHeaders, push1ResHeaders],
                [pushed2, push2ReqHeaders, push2ResHeaders]
            ]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client, 2)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(push1ReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(push2ReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me-again',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(push1ResHeaders[':status']).to.equal(200);
        expect(push2ResHeaders[':status']).to.equal(200);

        await Promise.all([
            expectToStream(request, 'body'),
            expectToStream(pushed1, 'pushed'),
            expectToStream(pushed2, 'pushed again')
        ]);
    });

    it('does not allow pushing without a response.', { plan: 2 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    h.push('/push-me');

                    return 'body';
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [headers, [ignore, event]] = await Promise.all([ // eslint-disable-line no-unused-vars
            Toys.event(request, 'response'),
            Toys.event(server.events, { name: 'request', channels: 'error' }, { error: false, multiple: true })
        ]);

        expect(headers[':status']).to.equal(500);
        expect(event.error.message).to.contain('Must server-push with a non-error response.');
    });

    it('does not allow pushing with an error response.', { plan: 2 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const { response } = h.push(Boom.notFound(), '/push-me');

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [headers, [ignore, event]] = await Promise.all([ // eslint-disable-line no-unused-vars
            Toys.event(request, 'response'),
            Toys.event(server.events, { name: 'request', channels: 'error' }, { error: false, multiple: true })
        ]);

        expect(headers[':status']).to.equal(500);
        expect(event.error.message).to.contain('Must server-push with a non-error response.');
    });

    it('pushes specified headers.', { plan: 5 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');

                    h.push(response, '/push-me', {
                        'x-custom': 'pooh',
                        'user-agent': 'lab'
                    });

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'x-custom': 'pooh',
            'user-agent': 'lab'
        });

        expect(pushResHeaders[':status']).to.equal(200);

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('lets pushed resources push more resources.', { plan: 8 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');
                    h.push(response, '/push-me');

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, h) => {

                    const response = h.response('pushed');
                    h.push(response, '/push-me-chain');

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me-chain',
                handler: (request) => 'chain'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [
                [pushed1, push1ReqHeaders, push1ResHeaders],
                [pushed2, push2ReqHeaders, push2ResHeaders]
            ]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client, 2)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(push1ReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me-chain',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(push2ReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(push1ResHeaders[':status']).to.equal(200);
        expect(push2ResHeaders[':status']).to.equal(200);

        await Promise.all([
            expectToStream(request, 'body'),
            expectToStream(pushed1, 'chain'),
            expectToStream(pushed2, 'pushed')
        ]);
    });

    it('uses original request\'s user-agent to make push-requests.', { plan: 5 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');
                    h.push(response, '/push-me', { 'x-custom': 'pooh' });

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/', 'user-agent': 'big-test' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'x-custom': 'pooh',
            'user-agent': 'big-test'
        });

        expect(pushResHeaders[':status']).to.equal(200);

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('uses credentials from original request to make push-requests.', { plan: 9 }, async (flags) => {

        const { server, client } = await makeServer([]);

        Toys.auth.strategy(server, 'custom', (request, h) => {

            const { authorization } = request.headers;

            if (!authorization) {
                throw Boom.unauthorized(null, 'Custom');
            }

            return h.authenticated({ credentials: { user: authorization } });
        });

        server.auth.default('custom');

        server.route([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');
                    h.push(response, '/push-me');

                    expect(request.auth.isAuthenticated).to.equal(true);
                    expect(request.auth.credentials).to.equal({ user: 'harper' });

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => {

                    expect(request.auth.isAuthenticated).to.equal(true);
                    expect(request.auth.credentials).to.equal({ user: 'harper' });

                    return 'pushed';
                }
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/', authorization: 'harper' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(pushResHeaders[':status']).to.equal(200);

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('handles relative path for pushed resource with realm prefix.', { plan: 5 }, async (flags) => {

        const plugin = {
            name: 'sven',
            register(srv) {

                srv.route([
                    {
                        method: 'get',
                        path: '/',
                        handler: (request, h) => {

                            const response = h.response('body');
                            h.push(response, 'push-me');

                            return response;
                        }
                    },
                    {
                        method: 'get',
                        path: '/push-me',
                        handler: (request) => 'pushed'
                    }
                ]);
            }
        };

        const { server, client } = await makeServer([]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        await server.register(plugin, { routes: { prefix: '/pre' } });

        const request = client.request({ ':path': '/pre' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/pre/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(pushResHeaders[':status']).to.equal(200);

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('handles relative path for pushed resource without realm prefix.', { plan: 5 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');
                    h.push(response, 'push-me');

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(pushResHeaders[':status']).to.equal(200);

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('h.push() indicates if push was not allowed.', { plan: 4 }, async (flags) => {

        const { server, client: ignore } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const response = h.response('body');
                    const result = h.push(response, '/push-me');

                    expect(result).to.only.contain(['allowed', 'response']);
                    expect(result.allowed).to.equal(false);
                    expect(result.response).to.shallow.equal(response);

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request) => 'pushed'
            }
        ]);

        ignore.destroy();

        const client = Http2.connect(server.info.uri, {
            rejectUnauthorized: false,
            settings: { enablePush: false }
        });

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        await expectToStream(request, 'body');
    });

    describe('h.pushAllowed()', () => {

        it('returns false when not using an http2 server.', async (flags) => {

            const server = Hapi.server();

            flags.onCleanup = async () => await server.stop();

            await server.register(Underdog);

            server.route({
                method: 'get',
                path: '/',
                handler: (request, h) => h.pushAllowed()
            });

            await server.start();

            const req = Http.get(`${server.info.uri}`);
            const res = await Toys.event(req, 'response');

            await expectToStream(res, 'false');
        });

        it('returns false when falling back to http1.', async (flags) => {

            const server = Hapi.server({
                tls: true,
                listener: Http2.createSecureServer({
                    ...creds,
                    allowHTTP1: true
                })
            });

            flags.onCleanup = async () => await server.stop();

            await server.register(Underdog);

            server.route({
                method: 'get',
                path: '/',
                handler: (request, h) => h.pushAllowed()
            });

            await server.start();

            const req = Https.get({
                href: server.info.uri,
                port: server.info.port,
                agent: new Https.Agent({ rejectUnauthorized: false })
            });

            const res = await Toys.event(req, 'response');

            await expectToStream(res, 'false');
        });

        it('returns false when using http2 but the client doesn\'t support push.', async (flags) => {

            const server = Hapi.server({
                tls: true,
                listener: Http2.createSecureServer(creds)
            });

            await server.register(Underdog);

            server.route({
                method: 'get',
                path: '/',
                handler: (request, h) => h.pushAllowed()
            });

            await server.start();

            const client = Http2.connect(server.info.uri, {
                rejectUnauthorized: false,
                settings: { enablePush: false }
            });

            flags.onCleanup = async () => {

                client.destroy();
                await server.stop();
            };

            const res = client.request({ ':path': '/' });

            await expectToStream(res, 'false');
        });

        it('returns true when using http2 and the client supports push.', async (flags) => {

            const server = Hapi.server({
                tls: true,
                listener: Http2.createSecureServer(creds)
            });

            await server.register(Underdog);

            server.route({
                method: 'get',
                path: '/',
                handler: (request, h) => h.pushAllowed()
            });

            await server.start();

            const client = Http2.connect(server.info.uri, {
                rejectUnauthorized: false
            });

            flags.onCleanup = async () => {

                client.destroy();
                await server.stop();
            };

            const res = client.request({ ':path': '/' });

            await expectToStream(res, 'true');
        });

        it('works when called in a pushed request.', async (flags) => {

            const server = Hapi.server({
                tls: true,
                listener: Http2.createSecureServer(creds)
            });

            await server.register(Underdog);

            server.route([
                {
                    method: 'get',
                    path: '/',
                    handler: (request, h) => {

                        const response = h.response('body');
                        h.push(response, '/push-me');

                        return response;
                    }
                },
                {
                    method: 'get',
                    path: '/push-me',
                    handler: (request, h) => h.pushAllowed()
                }
            ]);

            await server.start();

            const client = Http2.connect(server.info.uri, {
                rejectUnauthorized: false
            });

            flags.onCleanup = async () => {

                client.destroy();
                await server.stop();
            };

            client.request({ ':path': '/' });

            const [[pushed]] = await getPushes(client);

            await expectToStream(pushed, 'true');
        });
    });

    it('works with node <9.4.0.', { plan: 9 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const { stream } = request.raw.res;
                    const { pushStream } = stream;
                    stream.pushStream = (headers, cb) => {

                        pushStream.call(stream, headers, (x, y) => cb(x || y));
                    };

                    const response = h.response('body');
                    const result = h.push(response, '/push-me');

                    expect(result).to.only.contain(['allowed', 'response']);
                    expect(result.allowed).to.equal(true);
                    expect(result.response).to.shallow.equal(response);

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, h) => {

                    return h.response('pushed').header('x-custom', 'winnie').code(201);
                }
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(pushResHeaders[':status']).to.equal(201);
        expect(pushResHeaders['x-custom']).to.equal('winnie');

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('works with node >=9.4.0.', { plan: 9 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const { stream } = request.raw.res;
                    const { pushStream } = stream;
                    stream.pushStream = (headers, cb) => {

                        pushStream.call(stream, headers, (x, y) => cb(null, x || y));
                    };

                    const response = h.response('body');
                    const result = h.push(response, '/push-me');

                    expect(result).to.only.contain(['allowed', 'response']);
                    expect(result.allowed).to.equal(true);
                    expect(result.response).to.shallow.equal(response);

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, h) => {

                    return h.response('pushed').header('x-custom', 'winnie').code(201);
                }
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy();
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        const [
            headers,
            [[pushed, pushReqHeaders, pushResHeaders]]
        ] = await Promise.all([
            Toys.event(request, 'response'),
            getPushes(client)
        ]);

        expect(headers[':status']).to.equal(200);

        expect(pushReqHeaders).to.contain({
            ':method': 'GET',
            ':path': '/push-me',
            ':scheme': 'https',
            'user-agent': 'shot'
        });

        expect(pushResHeaders[':status']).to.equal(201);
        expect(pushResHeaders['x-custom']).to.equal('winnie');

        await expectToStream(request, 'body');
        await expectToStream(pushed, 'pushed');
    });

    it('errors on a failed http2stream.pushStream().', { plan: 5 }, async (flags) => {

        const { server, client } = await makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, h) => {

                    const { stream } = request.raw.res;
                    const { pushStream } = stream;
                    stream.pushStream = (headers, cb) => {

                        pushStream.call(stream, headers, () => cb(new Error('Oops!')));
                    };

                    const response = h.response('body');
                    const result = h.push(response, '/push-me');

                    expect(result).to.only.contain(['allowed', 'response']);
                    expect(result.allowed).to.equal(true);
                    expect(result.response).to.shallow.equal(response);

                    return response;
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, h) => {

                    return h.response('pushed').header('x-custom', 'winnie').code(201);
                }
            }
        ]);

        flags.onCleanup = async () => {

            client.destroy(); // Alternatively, client.close()
            await server.stop();
        };

        const request = client.request({ ':path': '/' });

        request.on('data', () => {});

        const [headers, [ignore, event]] = await Promise.all([ // eslint-disable-line no-unused-vars
            Toys.event(request, 'response'),
            Toys.event(server.events, { name: 'request', channels: 'error' }, { error: false, multiple: true }),
            Toys.event(request, 'end')
        ]);

        expect(headers[':status']).to.equal(500);
        expect(event.error.message).to.equal('Oops!');
    });
});
