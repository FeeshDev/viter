var gameIO = require("./gameio.js");
// var gameIO = require("gameio");
var express = require("express");
const fs = require("fs");
const path = require("path");
var app = express();
var UglifyJS = require("uglify-js");
var babel = require("@babel/core");
app.get("/status", function (req, res) {
    res.send("ok");
});

let key = 'gG7e3VxrUWWJKhgtRAfy6Wut7esMTqVPheqU54zn2dzqMWGevBdtubL3RdMj';


//! CERTIFICATE DETECTION -- USE THIS FOR ANYTHING MEANT ONLY TO HAPPEN ON THE VPS

let cert = undefined;

if (fs.existsSync(path.resolve("/", "etc", "letsencrypt"))) {
    console.log("Certificate detected!")
    cert = {
        key: fs.readFileSync(path.resolve("/", "etc", "letsencrypt", "live", "viter.io", "privkey.pem")),
        cert: fs.readFileSync(path.resolve("/", "etc", "letsencrypt", "live", "viter.io", "fullchain.pem"))
    };
}


//* Encoding
let encode = false;
if (cert) encode = true;

const JavaScriptObfuscator = require('javascript-obfuscator');

const obfuscateText = function (data) {
    console.log("Obfuscating code...");
    //let writePath = dirPath.replace('clean_js', path.join('client', 'static', 'js'));
    /*fs.readFile(dirPath, "utf8", function (err, data) {
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
        });*/

    var obfuscationResult = JavaScriptObfuscator.obfuscate(data, {
        optionsPreset: 'low-obfuscation',
        debugProtection: true,
        debugProtectionInterval: true,
        disableConsoleOutput: true,
        stringArrayEncoding: ['base64'],
        reservedNames: []
    })

    console.log("Obfuscating complete!");
    return obfuscationResult._obfuscatedCode;

    /*
    fs.writeFile(dirPath, obfuscationResult, 'utf-8', function (err) {
        if (err) return console.log(err);
    });*/
}

if (encode) {
    const es5Code = babel.transformSync(fs.readFileSync(path.resolve("..", "client", "js", "client.js"), "utf8") + "; " + fs.readFileSync(path.resolve("..", "client", "js", "gameio.js"), "utf8"), {
        presets: ["@babel/preset-env"],
    });
    var minifiedScript = UglifyJS.minify(es5Code.code).code;
    console.log("Finished minifying");
    minifiedScript = obfuscateText(minifiedScript);
}


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
    app.get("/client/script.js", (req, res) => {
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.end(encode ? minifiedScript : fs.readFileSync(path.resolve("..", "client", "js", "client.js"), "utf8") + "; " + fs.readFileSync(path.resolve("..", "client", "js", "gameio.js"), "utf8"));
    });
    app.get("/client/js/", function (req, res) {
        res.send("Don't even try :)");
    });
}


/*
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
}*/

if (cert) {
    let app2 = express();
    app2.get("/*", function (req, res) {
        res.redirect(301, 'https://viter.io');
    });
    let port = 80;
    app2.listen(port, () => {
        console.log(`Redirect listening on port ${port}.`)
    });
}

// GLOBALS
global.game = new gameIO.game({ port: cert ? 443 : 80, enablews: false, app: app, certs: cert });

global.getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

game.globalCoordPackets = [];

//* REQUIREMENTS
require("./server/object.js");
require("./server/player.js");
require("./server/wall.js");
require("./server/bullet.js");
require("./server/gameManager.js");
require("./server/commandHandler.js");

//! WEBSOCKET EVENTS
game.wsopen = function (ws) {
    console.log(`Client (${ws.ipAdress}) connected.`);
    ws.isPlaying - false;
    ws.currentPackets.push({ type: "p", count: game.clients.length });
    setInterval(() => {
        if (ws.isPlaying !== true) if (ws.currentPackets !== undefined) ws.currentPackets.push({ type: "p", count: game.clients.length });
    }, 10000);
    //ws.self = game.create("spectator");
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
            let playerName = packet.name === "" ? "viter.io" : packet.name;
            ws.self = game.create("player", {
                name: playerName,
                devID: packet.branch,
                startXp: ws.startingXp
                // dance: packet.dance 
            });
            ws.isPlaying = true;
            if (ws.currentPackets !== []) ws.currentPackets.push({ type: "i", list: game.globalCoordPackets });
            if (ws.currentPackets !== []) ws.currentPackets.push({ type: "s", scale: MAP_SCALE });
            ws.self.death = (t, xp, lvl) => {
                ws.currentPackets.push({ type: "d", time: Date.now() - t, xp: xp, level: lvl });
                ws.self = undefined;
                ws.isPlaying = false;
                ws.startingXp = Math.round(Math.ceil(Math.pow((lvl + 2), 2.635)) / 4);
            }
            ws.self.sendPacket = (packet) => {
                if (ws.currentPackets === undefined) return;
                ws.currentPackets.push(packet);
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

game.addPacketType(
    "upgradePacket",
    function (packet, ws) {
        if (ws.self === undefined) return;
        let type = packet.object[0];
        let data = packet.object[1];
        switch (type) {
            case "body":
                ws.self.upgradeBody(data);
                break;
            case "turret":
                ws.self.upgradeTurret(data);
                break;
            case "stat":
                break;
            default:
                console.log(`Upgrade packet with "${type}" and "${JSON.stringify(data)}" received.`)
                break;
        }
    }
);

game.addPacketType(
    "ping",
    (packet, ws) => {
        ws.currentPackets.push({ type: "ping", data: packet.object });
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