var gameIO = require("gameio");
var express = require("express");
const { constants } = require("buffer");
const fs = require("fs");
const path = require("path");
var app = express();
app.get("/status", function (req, res) {
    res.send("ok");
});

let key = '6YHQLQxcPwtuqw7D9DnkhTfhrEH3swbk43wkp3FGDqdZjMHCYb';

let pathToCheck = path.resolve("..", "client", "index.html");
if (fs.existsSync(pathToCheck)) {
    app.use("/client", express.static(path.resolve("..", "client")));
    app.get("/", function (req, res) {
        let pathToCheck = path.resolve("..", "client", "index2.html");
        res.sendFile(pathToCheck);
    });
    app.get("/6YHQLQxcPwtuqw7D9DnkhTfhrEH3swbk43wkp3FGDqdZjMHCYb", function (req, res) {
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

game.globalCoords = [];

//* REQUIREMENTS
require("./server/object.js");
require("./server/player.js");
require("./server/wall.js");
require("./server/bullet.js");
require("./server/gameManager.js")
require("./server/commandHandler.js")

//! WEBSOCKET EVENTS
game.wsopen = function (ws) {
    console.log("Client Connected");
    ws.self = game.create("spectator");
    /*
    if (ws.self === undefined || ws.self.type == "spectator") {
        ws.self = game.create("player");
        //!ws.currentPackets.push({ type: "i", list: game.globalCoords })
    }*/
}

game.wsclose = function (ws) {
    if (ws.self) game.remove(ws.self);
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

game.addPacketType(
    "playPacket",
    function (packet, ws) {
        if (ws.self === undefined || ws.self.type == "spectator") {
            if (ws.self.type == "spectator") game.remove(ws.self);
            let playerName = packet.name != "" ? packet.name : "viter.io";
            ws.self = game.create("player", { name: playerName });
            ws.self.death = () => {
                ws.currentPackets.push({ type: "d" })
            }
        }
    }
);

game.addPacketType(
    "requestCommand",
    function (packet, ws) {
        executeCommand(ws.self, packet.command, packet.accessCode);
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