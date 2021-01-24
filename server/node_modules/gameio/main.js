exports.game = function (options) {
    var server = null;
    try {
        //server = require( 'uws' ).Server;
    } catch (e) {
        console.log(e);
    }
    var p2 = require('p2');
    var msgpack = require('msgpack-lite');
    //var gameloop = require( 'node-gameloop' );
    options = options || {};

    var port = options.port || process.env.PORT || 5000;
    var baseServer;
    var wss = null;
    if (options.app != undefined) {
        if (options.certs) {
            baseServer = require("https").Server(options.certs, options.app);
        } else {
            baseServer = require("http").createServer(options.app);
        }
    } else {
        if (options.certs) {
            baseServer = require("https").Server(options.certs);
        } else {
            baseServer = require("http").createServer();
        }
        wss = new server({ server: baseServer });
    }
    baseServer.listen(port, () => console.log(`Listening on port ${port}.`));

    var game = {
        server: server,
        wss: wss,
        p2: p2,
        msgpack: msgpack,
        baseServer: baseServer,
        //gameloop : gameloop,
        world: new p2.World({ gravity: [0, 0] }),
        currentID: -1,
        timeStep: 1 / 20,
        maxTicksAsleep: 200,
        ticksSinceCloseUpdate: 0,
        maxTicksSinceCloseUpdate: 10,
        ticksSinceNeedUpdate: 0,
        lastTick: Date.now(),
        now: Date.now(),
        dt: 1,
        objects: [],
        clients: [],
        types: {},
        collisions: [],
        decollisions: [],
        envs: {},
        closeSockets: [],
        packetTypes: {
            "getID": function (packet, ws) {
                if (ws.self !== undefined)
                    ws.currentPackets.push({ type: "setID", id: ws.self.id, s: ws.spectating });
            },
            "getObject": function (packet, ws) {
                if (ws.currentPackets === undefined)
                    return;
                for (var i = 0; i < game.objects.length; i++) {
                    if (game.objects[i].id == packet.object.id) {
                        ws.currentPackets.push(game.add(game.objects[i]));
                    }
                }
            },
            "getEnvs": function (packet, ws) {
                game.sendEnvs(ws);
            }
        },
        splice: function (object, array) {
            if (array.indexOf(object) != -1) {
                array.splice(array.indexOf(object), 1);
            }
        },
        findBody: function (body) {
            for (var i = 0; i < game.objects.length; i++) {
                if (game.objects[i].body == body) {
                    return game.objects[i];
                }
            }
            return null;
        },
        findObjectById: function (id) {
            for (let i = id; i >= 0; i--) {
                if (game.objects[i]) {
                    if (game.objects[i].id == id) {
                        return game.objects[i];
                    }
                }
            }
            // if the program hasn't returned yet then do a full game.objects search
            // should never happen but can't be too safe
            console.log("Had to search longer");
            for (let i = 0; i < game.objects.length; i++) {
                if (game.objects[i]) {
                    if (game.objects[i].id == id) {
                        return game.objects[i];
                    }
                }
            }
            console.log(`Object ${id} not found`);
            return null;
        },
        toBuffer: function (string) {
            var buf = new ArrayBuffer(string.length);
            var bufView = new Uint8Array(buf);
            for (var i = 0, strLen = string.length; i < strLen; i++) {
                bufView[i] = string.charCodeAt(i);
            }
            return buf;
        },
        fromBuffer: function (buffer) {
            try {
                return String.fromCharCode.apply(null, new Uint8Array(buffer));
            } catch (e) {
                return "";
            }
        },
        addType: function (type, create, tickUpdate, updatePacket, add, remove) {
            game.types[type] = {
                create: create,
                tickUpdate: tickUpdate || function (obj) { },
                updatePacket: updatePacket || function (obj, packet) { },
                add: add || function (obj) { },
                remove: remove || function (obj) { }
            };
        },
        addPacketType: function (type, func) {
            game.packetTypes[type] = func;
        },
        updateObjects: function () {
            for (var i = 0; i < game.objects.length; i++) {
                game.types[game.objects[i].type].tickUpdate(game.objects[i]);
            }
        },
        sendEnvs: function (ws) {
            ws.currentPackets.push({ type: "e", envs: game.envs });
        },
        create: function (type, extra) {
            if (game.types[type] == undefined)
                return null;
            game.currentID++;
            var obj = {
                type: type,
                id: game.currentID,
                needsUpdate: true,
                updateAtAll: true,
                body: undefined,
                ticksAsleep: Math.round(Math.random() * game.maxTicksAsleep),
                wasAsleep: false,
                shouldRemove: false,
                packet: null,
                old: {
                    position: [0, 0],
                    angle: 0,
                    mouseAngle: 0,
                }
            };
            if (extra !== undefined) {
                game.types[type].create(obj, extra);
            } else {
                game.types[type].create(obj);
            }
            obj.old.position[0] = Math.round(obj.body.position[0]);
            obj.old.position[1] = Math.round(obj.body.position[1]);
            obj.old.angle = Math.round(obj.body.angle * 100);
            obj.old.mouseAngle = obj.playerMouse ? Math.round(obj.playerMouse.angle) : 0;
            game.objects.push(obj);
            game.world.addBody(obj.body);
            for (var i = 0; i < game.clients.length; i++) {
                if (game.clients[i].self === undefined) {
                    continue;
                }
                if (game.notUpdatedIsClose(game.clients[i], obj)) {
                    game.clients[i].closeObjects.push(obj);
                    if (game.clients[i].closeObjects.indexOf(obj) != -1) {
                        game.clients[i].currentPackets.push(game.add(obj));
                    }
                }
            }
            return obj;
        },
        removePacket: function (object) {
            var packet = {
                t: "z",
                i: object.id
            }
            game.types[object.type].remove(object, packet);
            return packet;
        },
        remove: function (object) {
            object.shouldRemove = true;
        },
        actuallyRemove: function (object) {
            if (game.types[object.type] == undefined)
                return;
            object.packet = null;
            var packet = game.removePacket(object);
            game.clients.forEach(function (client) {
                if (client.currentPackets !== undefined && client.closeObjects.indexOf(object) != -1)
                    client.currentPackets.push(packet);
                client.nextPackets.push(packet);
            });
            game.world.removeBody(object.body);
            game.splice(object, game.objects);
            object = undefined;
        },
        createPacket: function (object) {
            if (game.types[object.type] == undefined)
                return;
            var packet = {
                t: "y", // Update
                a: [object.id, Math.round(object.body.position[0]), Math.round(object.body.position[1]), Math.round(object.body.angle * 100)]
            };
            game.types[object.type].updatePacket(object, packet);
            return packet;
        },
        add: function (object) {
            if (game.types[object.type] == undefined)
                return;
            var packet = {
                t: "x", // Add
                i: object.id,
                b: object.type,
                x: Math.round(object.body.position[0]),
                y: Math.round(object.body.position[1]),
                a: Math.round(object.body.angle * 100),
                n: object.needsUpdate
            };
            game.types[object.type].add(object, packet);
            return packet;
        },
        sendID: function (ws) {
            if (ws.currentPackets !== undefined)
                ws.currentPackets.push({ type: "setID", id: ws.self.id, s: ws.spectating });
        },
        sendPackets: function () {
            game.clients.forEach(function (client) {
                if (client.currentPackets.length > 0 && client.readyState == 1) {
                    client.currentPackets.forEach(function (packet) {
                        if (packet.t === undefined && packet.type !== undefined) {
                            packet.t = packet.type;
                            delete packet.type;
                        }
                    });
                    //console.log(client.currentPackets);
                    client.send(game.msgpack.encode(client.currentPackets));
                    client.currentPackets = client.nextPackets;
                    client.nextPackets = [];
                }
            });
        },
        addCollision: function (typeA, typeB, response) {
            game.collisions.push(
                {
                    typeA: typeA,
                    typeB: typeB,
                    response: response
                }
            );
        },
        handleCollision: function (e) {
            var firstBody = e.bodyA;
            var firstShape = e.shapeA;
            var secondBody = e.bodyB;
            var secondShape = e.shapeB;
            for (var i = 0; i < 2; i++) {
                var first = game.findBody(firstBody);
                var second = game.findBody(secondBody);
                if (first == null || second == null) {
                    return;
                }
                for (var a = 0; a < game.collisions.length; a++) {
                    if (game.collisions[a].typeA == first.type && game.collisions[a].typeB == second.type) {
                        game.collisions[a].response(first, second, firstShape, secondShape, e.contactEquations);
                        return;
                    }
                }
                if (first.type == second.type) {
                    return;
                }
                firstBody = e.bodyB;
                firstShape = e.shapeB;
                secondBody = e.bodyA;
                secondShape = e.shapeA;
            }
            firstBody = undefined;
            firstShape = undefined;
            secondBody = undefined;
            secondShape = undefined;
        },
        addEndcontact: function (typeA, typeB, response) {
            game.decollisions.push(
                {
                    typeA: typeA,
                    typeB: typeB,
                    response: response
                }
            );
        },
        handleEndcontact: function (e) {
            var firstBody = e.bodyA;
            var firstShape = e.shapeA;
            var secondBody = e.bodyB;
            var secondShape = e.shapeB;
            for (var i = 0; i < 2; i++) {
                var first = game.findBody(firstBody);
                var second = game.findBody(secondBody);
                if (first == null || second == null) {
                    return;
                }
                for (var a = 0; a < game.decollisions.length; a++) {
                    if (game.decollisions[a].typeA == first.type && game.decollisions[a].typeB == second.type) {
                        game.decollisions[a].response(first, second, firstShape, secondShape);
                        return;
                    }
                }
                if (first.type == second.type) {
                    return;
                }
                firstBody = e.bodyB;
                firstShape = e.shapeB;
                secondBody = e.bodyA;
                secondShape = e.shapeA;
            }
            firstBody = undefined;
            firstShape = undefined;
            secondBody = undefined;
            secondShape = undefined;
        },
        playerInput: function () {
            return {
                up: false,
                down: false,
                left: false,
                right: false,
                space: false,
                shift: false
            };
        },
        body: function (mass) {
            return new p2.Body({ mass: mass || 0 });
        },
        rectangle: function (width, height) {
            return new p2.Box({ width: width, height: height });
        },
        circle: function (radius) {
            return new p2.Circle({ radius: radius });
        },
        broadcast: function (packet) {
            for (var i = 0; i < game.clients.length; i++) {
                game.clients[i].currentPackets.push(packet);
            }
        },
        isClose: function (client, object) {
            if (Math.abs(client.self.body.position[0] - object.body.position[0]) < 1920 / 2 + 1000 / 3 && Math.abs(client.self.body.position[1] - object.body.position[1]) < 1080 / 2 + 1000 / 3) {
                return true;
            }
            return false;
        },
        notUpdatedIsClose: function (client, object) {
            if (client.self === undefined) {
                return false;
            }
            if (Math.abs(client.self.body.position[0] - object.body.position[0]) < 1920 / 2 + 500 && Math.abs(client.self.body.position[1] - object.body.position[1]) < 1080 / 2 + 500) {
                return true;
            }
            return false;
        },
        updateClientCloseObjects: function () {
            game.clients.forEach(function (client) {
                if (client.self === undefined) {
                    return;
                }
                game.updateCloseObjects(client);
            });
        },
        updateCloseObjects: function (client) {
            var closeObjects = [];
            for (var i = 0; i < game.objects.length; i++) {
                if (!game.objects[i].updateAtAll)
                    continue;
                if (game.notUpdatedIsClose(client, game.objects[i])) {
                    closeObjects.push(game.objects[i]);
                    if (client.closeObjects.indexOf(game.objects[i]) == -1) {
                        client.currentPackets.push(game.add(game.objects[i]));
                    }
                } else if (client.closeObjects.indexOf(game.objects[i]) != -1) {
                    client.currentPackets.push(game.removePacket(game.objects[i]));
                }
            }
            client.closeObjects = closeObjects;
        },
        mainLoop: function () { },
        main: function () {
            game.now = Date.now();
            game.dt = (game.now - game.lastTick) / 42;
            game.lastTick = game.now;

            for (var i = 0; i < game.closeSockets.length; i++) {
                game.closeSocket(game.closeSockets[i]);
            }
            game.closeSockets.splice(0, i);

            for (var i = 0; i < game.clients.length; i++) {
                if (game.clients[i].justOpened !== undefined) {
                    if (game.clients[i].justOpened == true) {
                        game.wsopen(game.clients[i]);
                        if (game.clients[i].self !== undefined) {
                            game.updateCloseObjects(game.clients[i]);
                        }
                        game.clients[i].justOpened = false;
                    }
                }
                if (game.clients[i].receivedPackets.length > 0) {
                    for (var u = 0; u < game.clients[i].receivedPackets.length; u++) {
                        if (game.packetTypes[game.clients[i].receivedPackets[u].type] !== undefined)
                            game.packetTypes[game.clients[i].receivedPackets[u].type](game.clients[i].receivedPackets[u], game.clients[i]);
                    }
                    game.clients[i].receivedPackets.splice(0, u);
                }
            }

            game.world.step(game.timeStep, 0, 1);
            game.ticksSinceCloseUpdate++;
            if (game.ticksSinceCloseUpdate >= game.maxTicksSinceCloseUpdate) {
                game.ticksSinceCloseUpdate = 0;
                game.updateClientCloseObjects();
            }
            game.updateObjects();
            var updateNeeds = false;
            game.ticksSinceNeedUpdate++;
            if (game.ticksSinceNeedUpdate >= 200) {
                updateNeeds = true;
                game.ticksSinceNeedUpdate = 0;
            }
            for (var i = 0; i < game.objects.length; i++) {
                if (game.objects[i].shouldRemove) {
                    game.actuallyRemove(game.objects[i]);
                    i--;
                    continue;
                }
                if (!game.objects[i].updateAtAll) {
                    continue;
                }
                if (!game.objects[i].needsUpdate) {
                    if (updateNeeds) {
                        game.objects[i].packet = game.createPacket(game.objects[i]);
                        /*for( var u = 0; u < game.clients.length; u++ ) {
                            if( game.clients[ u ].closeObjects.indexOf( game.objects[ i ] ) != -1 ) {
                                game.clients[ u ].currentPackets.push( newpacket );
                            }
                        }*/
                    }
                    continue;
                }
                if (Math.round(game.objects[i].body.position[0]) == game.objects[i].old.position[0] &&
                    Math.round(game.objects[i].body.position[1]) == game.objects[i].old.position[1] &&
                    Math.round(game.objects[i].body.angle * 100) == game.objects[i].old.angle &&
                    Math.round(game.objects[i].mouseAngle * 100) == game.objects[i].old.mouseAngle) {

                    game.objects[i].ticksAsleep++;
                    if (game.objects[i].ticksAsleep > game.maxTicksAsleep) {
                        game.objects[i].ticksAsleep = 0;
                    }
                    game.objects[i].wasAsleep = true;
                } else {
                    game.objects[i].ticksAsleep = 0;
                    game.objects[i].wasAsleep = false;
                }
                game.objects[i].old.position[0] = Math.round(game.objects[i].body.position[0]);
                game.objects[i].old.position[1] = Math.round(game.objects[i].body.position[1]);
                game.objects[i].old.angle = Math.round(game.objects[i].body.angle * 100);
                game.objects[i].old.mouseAngle = Math.round(game.objects[i].mouseAngle);
                if (game.objects[i].needsUpdate && game.objects[i].ticksAsleep == 0) {
                    game.objects[i].packet = game.createPacket(game.objects[i]);
                }
            }
            for (var u = 0; u < game.clients.length; u++) {
                for (var f = 0; f < game.clients[u].closeObjects.length; f++) {
                    if (game.clients[u].closeObjects[f].packet != null) {
                        game.clients[u].currentPackets.push(game.clients[u].closeObjects[f].packet);
                    }
                }
            }
            for (var i = 0; i < game.objects.length; i++) {
                game.objects[i].packet = null;
            }
            game.mainLoop();
            game.sendPackets();
            var dt = Date.now() - game.now;
            //console.log( dt );
            if (1000 * game.timeStep - dt > 0) {
                setTimeout(game.main, 1000 * game.timeStep - dt);
            } else {
                setImmediate(game.main);
            }
        },
        mainInterval: null,
        start: function () {
            game.now = Date.now();
            game.lastTick = game.now;
            //game.mainInterval = game.gameloop.setGameLoop( game.main, 1000 * game.timeStep );
            //game.mainInterval = setInterval( game.main, 1000 * game.timeStep );
            game.main();
        },
        wsopen: function (ws) {
        },
        wsclose: function (ws) {
        }
    };
    game.addType(
        // Type
        "spectator",
        // Create
        function (obj, extra) {
            obj.body = new game.body(0);
        },
        // Tick Update
        function (obj) {

        },
        // Packet Update
        function (obj, packet) {

        },
        // Add
        function (obj, packet) {

        },
        // Remove
        function (obj, packet) {

        }
    );
    game.world.on("beginContact", game.handleCollision);
    game.world.on("endContact", game.handleEndcontact);

    game.handleConnection = function (ws, req) {
        ws.ipAdress = req.connection.remoteAddress;
        ws.on('error', console.error);
        ws.currentPackets = [];
        ws.nextPackets = [];
        ws.self = undefined;
        ws.spectating = true;
        ws.justOpened = true;
        ws.closeObjects = [];
        ws.receivedPackets = [];
        game.clients.push(ws);
        game.sendEnvs(ws);
        ws.on('message', function (message) {
            var packets = [];
            try {
                packets = game.msgpack.decode(new Uint8Array(message));
            } catch (e) {
            }
            for (var i = 0; i < packets.length; i++) {
                ws.receivedPackets.push(packets[i]);
            }
        });
        ws.on('close', function () {
            game.closeSockets.push(ws);
        });
    };

    game.closeSocket = function (ws) {
        game.wsclose(ws);
        if (ws.currentPackets !== undefined)
            delete ws.currentPackets;
        if (ws.nextPackets !== undefined)
            delete ws.nextPackets;
        if (ws.self !== undefined && (!ws.spectating || ws.self.type == "spectator"))
            game.remove(ws.self);
        if (ws.closeObjects !== undefined)
            delete ws.closeObjects;
        if (ws.receivedPackets !== undefined)
            delete ws.receivedPackets;
        delete ws.self;
        delete ws.spectating;
        game.splice(ws, game.clients);
        ws.terminate();
        ws = undefined;
    }

    if (options.app != undefined) {
        require("express-ws")(options.app, baseServer);
        options.app.ws('/ws', game.handleConnection);
    } else {
        wss.on('connection', game.handleConnection);
    }

    return game;
};