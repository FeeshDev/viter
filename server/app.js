var gameIO = require("gameio");
var express = require("express");
const { constants } = require("buffer");
const fs = require("fs");
const path = require("path");
var app = express();
app.get("/status", function (req, res) {
    res.send("ok");
});

let pathToCheck = path.resolve("..", "client", "index.html");
if (fs.existsSync(pathToCheck)) {
    app.use("/client", express.static(path.resolve("..", "client")));
    app.get("/", function (req, res) {
        let pathToCheck = path.resolve("..", "client", "index.html");
        res.sendFile(pathToCheck);
    });
}

//* GLOBALS
global.game = new gameIO.game({ port: 80, enablews: false, app: app });

//game.world.setGlobalStiffness(1e18);
//game.world.defaultContactMaterial.restitution = 0.1;

global.getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//* REQUIREMENTS
require("./server/object.js");
require("./server/player.js");
require("./server/wall.js");
require("./server/bullet.js");
require("./server/gameManager.js")

//! WEBSOCKET EVENTS
game.wsopen = function (ws) {
    console.log("Client Connected");
    if (ws.self === undefined || ws.self.type == "spectator") {
        ws.self = game.create("player");
    }
}

game.wsclose = function (ws) {
    game.remove(ws.self);
}

//@ PACKETS
game.addPacketType(
    "updateControls",
    function (packet, ws) {
        if (ws.self !== undefined) {
            ws.self.playerInput = packet.object;
        }
    }
);

game.addPacketType(
    "updateMouse",
    function (packet, ws) {
        if (ws.self !== undefined) {
            ws.self.playerMouse = packet.object;
        }
    }
);
/*game.addPacketType(
    "getObject",
    function( packet, ws ) {
        if( ws.currentPackets === undefined )
            return;
        for( var i = 0; i < game.objects.length; i++ ) {
            if( game.objects[ i ].id == packet.object.id ) {
                ws.currentPackets.push( game.add( game.objects[ i ] ) );
            }
        }
    }
);
game.addPacketType(
    "getID",
    function( packet, ws ) {
        if( ws.self !== undefined )
            ws.currentPackets.push( { type : "setID", id : ws.self.id } );
    }
);*/

//! START
game.start();