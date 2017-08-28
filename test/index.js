'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Items = require('items');
const Hapi = require('hapi');
const Boom = require('boom');
const Http2 = require('http2');
const Spdy = require('spdy');
const Underdog = require('..');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const internals = {};

describe('Underdog', () => {

    const makeServer = (noStart, routes, cb) => {

        if (typeof cb === 'undefined') {
            cb = routes;
            routes = noStart;
            noStart = false;
        }

        const creds = {
            key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA0UqyXDCqWDKpoNQQK/fdr0OkG4gW6DUafxdufH9GmkX/zoKz\ng/SFLrPipzSGINKWtyMvo7mPjXqqVgE10LDI3VFV8IR6fnART+AF8CW5HMBPGt/s\nfQW4W4puvBHkBxWSW1EvbecgNEIS9hTGvHXkFzm4xJ2e9DHp2xoVAjREC73B7JbF\nhc5ZGGchKw+CFmAiNysU0DmBgQcac0eg2pWoT+YGmTeQj6sRXO67n2xy/hA1DuN6\nA4WBK3wM3O4BnTG0dNbWUEbe7yAbV5gEyq57GhJIeYxRvveVDaX90LoAqM4cUH06\n6rciON0UbDHV2LP/JaH5jzBjUyCnKLLo5snlbwIDAQABAoIBAQDJm7YC3pJJUcxb\nc8x8PlHbUkJUjxzZ5MW4Zb71yLkfRYzsxrTcyQA+g+QzA4KtPY8XrZpnkgm51M8e\n+B16AcIMiBxMC6HgCF503i16LyyJiKrrDYfGy2rTK6AOJQHO3TXWJ3eT3BAGpxuS\n12K2Cq6EvQLCy79iJm7Ks+5G6EggMZPfCVdEhffRm2Epl4T7LpIAqWiUDcDfS05n\nNNfAGxxvALPn+D+kzcSF6hpmCVrFVTf9ouhvnr+0DpIIVPwSK/REAF3Ux5SQvFuL\njPmh3bGwfRtcC5d21QNrHdoBVSN2UBLmbHUpBUcOBI8FyivAWJhRfKnhTvXMFG8L\nwaXB51IZAoGBAP/E3uz6zCyN7l2j09wmbyNOi1AKvr1WSmuBJveITouwblnRSdvc\nsYm4YYE0Vb94AG4n7JIfZLKtTN0xvnCo8tYjrdwMJyGfEfMGCQQ9MpOBXAkVVZvP\ne2k4zHNNsfvSc38UNSt7K0HkVuH5BkRBQeskcsyMeu0qK4wQwdtiCoBDAoGBANF7\nFMppYxSW4ir7Jvkh0P8bP/Z7AtaSmkX7iMmUYT+gMFB5EKqFTQjNQgSJxS/uHVDE\nSC5co8WGHnRk7YH2Pp+Ty1fHfXNWyoOOzNEWvg6CFeMHW2o+/qZd4Z5Fep6qCLaa\nFvzWWC2S5YslEaaP8DQ74aAX4o+/TECrxi0z2lllAoGAdRB6qCSyRsI/k4Rkd6Lv\nw00z3lLMsoRIU6QtXaZ5rN335Awyrfr5F3vYxPZbOOOH7uM/GDJeOJmxUJxv+cia\nPQDflpPJZU4VPRJKFjKcb38JzO6C3Gm+po5kpXGuQQA19LgfDeO2DNaiHZOJFrx3\nm1R3Zr/1k491lwokcHETNVkCgYBPLjrZl6Q/8BhlLrG4kbOx+dbfj/euq5NsyHsX\n1uI7bo1Una5TBjfsD8nYdUr3pwWltcui2pl83Ak+7bdo3G8nWnIOJ/WfVzsNJzj7\n/6CvUzR6sBk5u739nJbfgFutBZBtlSkDQPHrqA7j3Ysibl3ZIJlULjMRKrnj6Ans\npCDwkQKBgQCM7gu3p7veYwCZaxqDMz5/GGFUB1My7sK0hcT7/oH61yw3O8pOekee\nuctI1R3NOudn1cs5TAy/aypgLDYTUGQTiBRILeMiZnOrvQQB9cEf7TFgDoRNCcDs\nV/ZWiegVB/WY7H0BkCekuq5bHwjgtJTpvHGqQ9YD7RhE8RSYOhdQ/Q==\n-----END RSA PRIVATE KEY-----\n',
            cert: '-----BEGIN CERTIFICATE-----\nMIIDBjCCAe4CCQDvLNml6smHlTANBgkqhkiG9w0BAQUFADBFMQswCQYDVQQGEwJV\nUzETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0\ncyBQdHkgTHRkMB4XDTE0MDEyNTIxMjIxOFoXDTE1MDEyNTIxMjIxOFowRTELMAkG\nA1UEBhMCVVMxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0\nIFdpZGdpdHMgUHR5IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\nANFKslwwqlgyqaDUECv33a9DpBuIFug1Gn8Xbnx/RppF/86Cs4P0hS6z4qc0hiDS\nlrcjL6O5j416qlYBNdCwyN1RVfCEen5wEU/gBfAluRzATxrf7H0FuFuKbrwR5AcV\nkltRL23nIDRCEvYUxrx15Bc5uMSdnvQx6dsaFQI0RAu9weyWxYXOWRhnISsPghZg\nIjcrFNA5gYEHGnNHoNqVqE/mBpk3kI+rEVzuu59scv4QNQ7jegOFgSt8DNzuAZ0x\ntHTW1lBG3u8gG1eYBMquexoSSHmMUb73lQ2l/dC6AKjOHFB9Ouq3IjjdFGwx1diz\n/yWh+Y8wY1Mgpyiy6ObJ5W8CAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAoSc6Skb4\ng1e0ZqPKXBV2qbx7hlqIyYpubCl1rDiEdVzqYYZEwmst36fJRRrVaFuAM/1DYAmT\nWMhU+yTfA+vCS4tql9b9zUhPw/IDHpBDWyR01spoZFBF/hE1MGNpCSXXsAbmCiVf\naxrIgR2DNketbDxkQx671KwF1+1JOMo9ffXp+OhuRo5NaGIxhTsZ+f/MA4y084Aj\nDI39av50sTRTWWShlN+J7PtdQVA5SZD97oYbeUeL7gI18kAJww9eUdmT0nEjcwKs\nxsQT1fyKbo7AlZBY4KSlUMuGnn0VnAsB9b+LxtXlDfnjyM8bVQx1uAfRo0DO8p/5\n3J5DTjAU55deBQ==\n-----END CERTIFICATE-----\n'
        };

        // const http2Listener = Http2.createServer(creds);
        const spdyH2Listener = Spdy.createServer({
            key: creds.key,
            cert: creds.cert,
            spdy: {
                protocols: ['h2']
            }
        });

        const server = new Hapi.Server({ debug: false });

        // server.connection({ listener: http2Listener, tls: true });
        server.connection({ listener: spdyH2Listener, tls: true });

        server.register(Underdog, (err) => {

            if (err) {
                return cb(err);
            }

            if (routes && routes.length) {
                server.route(routes);
            }

            if (noStart) {
                return cb(null, server);
            }

            server.start((err) => {

                const clients = server.connections.map((conn) => {

                    return Http2.connect(conn.info.uri, { rejectUnauthorized: false });
                });

                return cb(err, server, clients);
            });
        });
    };

    const callNTimes = (limit, cleanup, done) => {

        if (typeof done === 'undefined') {
            done = cleanup;
            cleanup = () => null;
        }

        let i = 0;

        return (err) => {

            i++;

            if (i > limit) {
                return done(new Error('Called function too many times'));
            }

            if (err) {
                i = limit;
                return done(err);
            }

            if (i === limit) {
                return done();
            }
        };
    };

    const expectToStream = (stream, expectedContent, cb) => {

        let content = '';

        stream.on('data', (data) => {

            content += data.toString();
        });

        stream.on('end', () => {

            expect(content).to.equal(expectedContent);
            return cb();
        });

        stream.on('error', cb);
    };

    it('pushes complete resource for an explicitly specified response.', { plan: 8 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    const response = request.generateResponse('body');
                    const result = reply.push(response, '/push-me');
                    expect(result).to.shallow.equal(response);

                    reply(response);
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed').header('x-custom', 'winnie').code(201);
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            Items.parallel(clients, (client, nxt) => {

                const next = callNTimes(2, client.destroy, nxt);
                const request = client.request({ ':path': '/' });

                request.on('response', (headers) => {

                    expect(headers[':status']).to.equal(200);
                    expectToStream(request, 'body', next);
                });

                client.on('stream', (pushed, reqHeaders) => {

                    pushed.on('push', (resHeaders) => {

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me',
                            ':scheme': 'https',
                            'user-agent': 'shot'
                        });

                        expect(resHeaders[':status']).to.equal(201);
                        expect(resHeaders['x-custom']).to.equal('winnie');
                        expectToStream(pushed, 'pushed', next);
                    });
                });
            }, (err1) => {

                srv.stop((err2) => done(err1 || err2));
            });
        });
    });

    it('pushes resource for the request\'s current response.', { plan: 7 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    reply('body');
                },
                config: {
                    ext: {
                        onPostHandler: {
                            method: (request, reply) => {

                                const response = reply.push('/push-me');
                                expect(response).to.shallow.equal(request.response);

                                reply.continue();
                            }
                        }
                    }
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed');
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            Items.parallel(clients, (client, nxt) => {

                const next = callNTimes(2, client.destroy, nxt);
                const request = client.request({ ':path': '/' });

                request.on('response', (headers) => {

                    expect(headers[':status']).to.equal(200);
                    expectToStream(request, 'body', next);
                });

                client.on('stream', (pushed, reqHeaders) => {

                    pushed.on('push', (resHeaders) => {

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me',
                            ':scheme': 'https',
                            'user-agent': 'shot'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'pushed', next);
                    });
                });
            }, (err1) => {

                srv.stop((err2) => done(err1 || err2));
            });
        });
    });

    it('pushes resources from internal routes.', { plan: 6 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    const response = reply('body');
                    reply.push(response, '/push-me');
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed');
                },
                config: { isInternal: true }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            Items.parallel(clients, (client, nxt) => {

                const next = callNTimes(2, client.destroy, nxt);
                const request = client.request({ ':path': '/' });

                request.on('response', (headers) => {

                    expect(headers[':status']).to.equal(200);
                    expectToStream(request, 'body', next);
                });

                client.on('stream', (pushed, reqHeaders) => {

                    pushed.on('push', (resHeaders) => {

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me',
                            ':scheme': 'https',
                            'user-agent': 'shot'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'pushed', next);
                    });
                });
            }, (err1) => {

                srv.stop((err2) => done(err1 || err2));
            });
        });
    });

    it('pushes multiple resources.', { plan: 9 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    const response = reply('body');
                    reply.push(response, '/push-me');
                    reply.push(response, '/push-me-again');
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed');
                }
            },
            {
                method: 'get',
                path: '/push-me-again',
                handler: (request, reply) => {

                    reply('pushed again');
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            Items.parallel(clients, (client, nxt) => {

                const next = callNTimes(3, client.destroy, nxt);
                const request = client.request({ ':path': '/' });

                request.on('response', (headers) => {

                    expect(headers[':status']).to.equal(200);
                    expectToStream(request, 'body', next);
                });

                client.on('stream', (pushed, reqHeaders) => {

                    pushed.on('push', (resHeaders) => {

                        if (reqHeaders[':path'] !== '/push-me') {
                            return;
                        }

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me',
                            ':scheme': 'https',
                            'user-agent': 'shot'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'pushed', next);
                    });

                    pushed.on('push', (resHeaders) => {

                        if (reqHeaders[':path'] !== '/push-me-again') {
                            return;
                        }

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me-again',
                            ':scheme': 'https',
                            'user-agent': 'shot'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'pushed again', next);
                    });
                });
            }, (err1) => {

                srv.stop((err2) => done(err1 || err2));
            });
        });
    });

    it('does not allow pushing without a response.', { plan: 3 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    reply.push('/push-me');
                    reply('body');
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed');
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            const next = callNTimes(2, () => {

                clients.forEach((client) => client.destroy());
                return srv.stop(done);
            });

            srv.on('request-error', (request, err) => {

                expect(err.message).to.contain('Must server-push with a non-error response.');
                return next();
            });

            // TODO specific language in this comment below may need to change.
            // No need to test against spdy and http2 cause we aint pushin
            // Also, https servers don't recover well from these errors :/
            const request = clients[0].request({ ':path': '/' });

            request.on('response', (headers) => {

                expect(headers[':status']).to.equal(500);
                return next();
            });

            request.on('push', () => done(new Error('Should not make it here')));
        });
    });

    it('does not allow pushing with an error response.', { plan: 3 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    const response = reply.push(Boom.notFound(), '/push-me');
                    reply(response);
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed');
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            const next = callNTimes(2, () => {

                clients.forEach((client) => client.destroy());
                return srv.stop(done);
            });

            srv.on('request-error', (request, err) => {

                expect(err.message).to.contain('Must server-push with a non-error response.');
                return next();
            });

            // TODO specific language in this comment below may need to change.
            // No need to test against spdy and http2 cause we aint pushin
            // Also, https servers don't recover well from these errors :/
            const request = clients[0].request({ ':path': '/' });

            request.on('response', (headers) => {

                expect(headers[':status']).to.equal(500);
                return next();
            });

            request.on('push', () => done(new Error('Should not make it here')));
        });
    });

    it('pushes specified headers.', { plan: 6 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    const response = request.generateResponse('body');
                    reply.push(response, '/push-me', {
                        'x-custom': 'pooh',
                        'user-agent': 'lab'
                    });

                    reply(response);
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed');
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            Items.parallel(clients, (client, nxt) => {

                const next = callNTimes(2, client.destroy, nxt);
                const request = client.request({ ':path': '/' });

                request.on('response', (headers) => {

                    expect(headers[':status']).to.equal(200);
                    expectToStream(request, 'body', next);
                });

                client.on('stream', (pushed, reqHeaders) => {

                    pushed.on('push', (resHeaders) => {

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me',
                            ':scheme': 'https',
                            'x-custom': 'pooh',
                            'user-agent': 'lab'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'pushed', next);
                    });
                });
            }, (err1) => {

                srv.stop((err2) => done(err1 || err2));
            });
        });
    });

    it('lets pushed resources push more resources.', { plan: 9 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    const response = request.generateResponse('body');
                    reply.push(response, '/push-me');

                    reply(response);
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    const response = request.generateResponse('pushed');
                    reply.push(response, '/push-me-chain');

                    reply(response);
                }
            },
            {
                method: 'get',
                path: '/push-me-chain',
                handler: (request, reply) => {

                    reply('chain');
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            Items.parallel(clients, (client, nxt) => {

                const next = callNTimes(3, client.destroy, nxt);
                const request = client.request({ ':path': '/' });

                request.on('response', (headers) => {

                    expect(headers[':status']).to.equal(200);
                    expectToStream(request, 'body', next);
                });

                client.on('stream', (pushed, reqHeaders) => {

                    pushed.on('push', (resHeaders) => {

                        if (reqHeaders[':path'] !== '/push-me') {
                            return;
                        }

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me',
                            ':scheme': 'https',
                            'user-agent': 'shot'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'pushed', next);
                    });

                    pushed.on('push', (resHeaders) => {

                        if (reqHeaders[':path'] !== '/push-me-chain') {
                            return;
                        }

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me-chain',
                            ':scheme': 'https',
                            'user-agent': 'shot'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'chain', next);
                    });
                });
            }, (err1) => {

                srv.stop((err2) => done(err1 || err2));
            });
        });
    });

    it('uses original request\'s user-agent to make push-requests.', { plan: 6 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    const response = request.generateResponse('body');
                    reply.push(response, '/push-me', { 'x-custom': 'pooh' });

                    reply(response);
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed');
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            Items.parallel(clients, (client, nxt) => {

                const next = callNTimes(2, client.destroy, nxt);
                const request = client.request({ ':path': '/', 'user-agent': 'big-test' });

                request.on('response', (headers) => {

                    expect(headers[':status']).to.equal(200);
                    expectToStream(request, 'body', next);
                });

                client.on('stream', (pushed, reqHeaders) => {

                    pushed.on('push', (resHeaders) => {

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me',
                            ':scheme': 'https',
                            'x-custom': 'pooh',
                            'user-agent': 'big-test'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'pushed', next);
                    });
                });
            }, (err1) => {

                srv.stop((err2) => done(err1 || err2));
            });
        });
    });

    it('uses credentials from original request to make push-requests.', { plan: 11 }, (done) => {

        makeServer(false, (err, srv) => {

            expect(err).to.not.exist();

            srv.auth.scheme('custom', () => {

                return {
                    authenticate: (request, reply) => {

                        const authorization = request.headers.authorization;

                        if (!authorization) {
                            return reply(Boom.unauthorized(null, 'Custom'));
                        }

                        reply.continue({ credentials: { user: authorization } });
                    }
                };
            });

            srv.auth.strategy('default', 'custom', true, {});

            srv.route([
                {
                    method: 'get',
                    path: '/',
                    handler: (request, reply) => {

                        const response = request.generateResponse('body');
                        reply.push(response, '/push-me');

                        expect(request.auth.isAuthenticated).to.equal(true);
                        expect(request.auth.credentials).to.equal({ user: 'harper' });

                        reply(response);
                    }
                },
                {
                    method: 'get',
                    path: '/push-me',
                    handler: (request, reply) => {

                        expect(request.auth.isAuthenticated).to.equal(true);
                        expect(request.auth.credentials).to.equal({ user: 'harper' });

                        reply('pushed');
                    }
                }
            ]);

            srv.start((err) => {

                expect(err).to.not.exist();

                const clients = srv.connections.map((conn) => {

                    return Http2.connect(conn.info.uri, { rejectUnauthorized: false });
                });

                Items.parallel(clients, (client, nxt) => {

                    const next = callNTimes(2, client.destroy, nxt);
                    const request = client.request({ ':path': '/', authorization: 'harper' });

                    request.on('response', (headers) => {

                        expect(headers[':status']).to.equal(200);
                        expectToStream(request, 'body', next);
                    });

                    client.on('stream', (pushed, reqHeaders) => {

                        pushed.on('push', (resHeaders) => {

                            expect(reqHeaders).to.contain({
                                ':method': 'GET',
                                ':path': '/push-me',
                                ':scheme': 'https',
                                'user-agent': 'shot'
                            });

                            expect(resHeaders[':status']).to.equal(200);
                            expectToStream(pushed, 'pushed', next);
                        });
                    });
                }, (err1) => {

                    srv.stop((err2) => done(err1 || err2));
                });
            });
        });
    });

    it('handles relative path for pushed resource with realm prefix.', { plan: 8 }, (done) => {

        const plugin = (srv, opts, next) => {

            srv.route([
                {
                    method: 'get',
                    path: '/',
                    handler: (request, reply) => {

                        const response = request.generateResponse('body');
                        reply.push(response, 'push-me');

                        reply(response);
                    }
                },
                {
                    method: 'get',
                    path: '/push-me',
                    handler: (request, reply) => {

                        reply('pushed');
                    }
                }
            ]);

            next();
        };

        plugin.attributes = { name: 'sven' };

        makeServer(false, (err, srv) => {

            expect(err).to.not.exist();

            srv.register(plugin, { routes: { prefix: '/pre' } }, (err) => {

                expect(err).to.not.exist();

                srv.start((err) => {

                    expect(err).to.not.exist();

                    const clients = srv.connections.map((conn) => {

                        return Http2.connect(conn.info.uri, { rejectUnauthorized: false });
                    });

                    Items.parallel(clients, (client, nxt) => {

                        const next = callNTimes(2, client.destroy, nxt);
                        const request = client.request({ ':path': '/pre' });

                        request.on('response', (headers) => {

                            expect(headers[':status']).to.equal(200);
                            expectToStream(request, 'body', next);
                        });

                        client.on('stream', (pushed, reqHeaders) => {

                            pushed.on('push', (resHeaders) => {

                                expect(reqHeaders).to.contain({
                                    ':method': 'GET',
                                    ':path': '/pre/push-me',
                                    ':scheme': 'https',
                                    'user-agent': 'shot'
                                });

                                expect(resHeaders[':status']).to.equal(200);
                                expectToStream(pushed, 'pushed', next);
                            });
                        });
                    }, (err1) => {

                        srv.stop((err2) => done(err1 || err2));
                    });
                });
            });
        });
    });

    it('handles relative path for pushed resource without realm prefix.', { plan: 6 }, (done) => {

        makeServer([
            {
                method: 'get',
                path: '/',
                handler: (request, reply) => {

                    const response = request.generateResponse('body');
                    reply.push(response, 'push-me');

                    reply(response);
                }
            },
            {
                method: 'get',
                path: '/push-me',
                handler: (request, reply) => {

                    reply('pushed');
                }
            }
        ],
        (err, srv, clients) => {

            expect(err).to.not.exist();

            Items.parallel(clients, (client, nxt) => {

                const next = callNTimes(2, client.destroy, nxt);
                const request = client.request({ ':path': '/' });

                request.on('response', (headers) => {

                    expect(headers[':status']).to.equal(200);
                    expectToStream(request, 'body', next);
                });

                client.on('stream', (pushed, reqHeaders) => {

                    pushed.on('push', (resHeaders) => {

                        expect(reqHeaders).to.contain({
                            ':method': 'GET',
                            ':path': '/push-me',
                            ':scheme': 'https',
                            'user-agent': 'shot'
                        });

                        expect(resHeaders[':status']).to.equal(200);
                        expectToStream(pushed, 'pushed', next);
                    });
                });
            }, (err1) => {

                srv.stop((err2) => done(err1 || err2));
            });
        });
    });
});
