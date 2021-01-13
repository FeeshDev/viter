var gameIO = require("gameio");
var express = require("express");
const { constants } = require("buffer");
const fs = require("fs");
const path = require("path");
var app = express();
app.get("/status", function (req, res) {
    res.send("ok");
});

const JavaScriptObfuscator = require('javascript-obfuscator');

const obfuscate = false;

let key = '6YHQLQxcPwtuqw7D9DnkhTfhrEH3swbk43wkp3FGDqdZjMHCYb';

let pathToCheck = path.resolve("..", "client", "index.html");
if (fs.existsSync(pathToCheck)) {
    app.get("/", function (req, res) {
        app.use("/client/main.css", express.static(path.resolve("..", "client", "main.css")));
        let pathToCheck = path.resolve("..", "client", "index2.html");
        res.sendFile(pathToCheck);
    });
    app.get(`/${key}`, function (req, res) {
        app.use("/client", express.static(path.resolve("..", "client")));
        let pathToCheck = path.resolve("..", "client", "index.html");
        res.sendFile(pathToCheck);
    });
    app.get("/client/js/", function (req, res) {
        res.send("Don't even try :)");
    });
}

/*
const obfuscatePathToFile = function (dirPath) {
    //let writePath = dirPath.replace('clean_js', path.join('client', 'static', 'js'));
    fs.readFile(dirPath, "utf8", function (err, data) {
        var obfuscationResult = JavaScriptObfuscator.obfuscate(data, {
            optionsPreset: 'low-obfuscation',
            debugProtection: true,
            debugProtectionInterval: true,
            disableConsoleOutput: true,
            stringArrayEncoding: ['base64'],
            reservedNames: [
                'hrefInc'
            ]
            //disableConsoleOutput: true,
            //identifierNamesGenerator: 'hexadecimal',
            //target: 'browser',
        });

        fs.writeFile(dirPath, obfuscationResult, 'utf-8', function (err) {
            if (err) return console.log(err);
        });

    });
}

const obfuscateClientCode = function () {
    fs.readdir(path.resolve("..", "client", "js"), function (err, files) {
        files.forEach(function (file) {
            if (!file.includes(".js")) {
            } else {
                fs.copyFile(path.resolve("..", "client", "js", file), path.resolve("..", "client", "clean_js", file), (err) => {
                    if (err) throw err;
                    console.log(`${file} was copied to clean_js/${file}`);
                });

                obfuscatePathToFile(path.resolve("..", "client", "js", file));
            }
        });
    });
    console.log('Obfuscation process ended.');
}

if (obfuscate) {
    obfuscateClientCode();
}*/

let cert = undefined;

if (fs.existsSync(path.resolve("/", "etc", "letsencrypt"))) {
    console.log("Certificate detected!")
    cert = {
        key: fs.readFileSync(path.resolve("/", "etc", "letsencrypt", "live", "viter.io", "privkey.pem")),
        cert: fs.readFileSync(path.resolve("/", "etc", "letsencrypt", "live", "viter.io", "fullchain.pem"))
    };
}

// GLOBALS
global.game = new gameIO.game({ port: 5000, enablews: false, app: app });

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
    console.log(`Client (${ws.ipAdress}) connected.`);
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
            ws.self = game.create("player", { name: playerName, devID: packet.devID });
            ws.self.death = (t) => {
                ws.currentPackets.push({ type: "d", time: Date.now() - t })
            }
            console.log(`"${playerName}" started playing.`);
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