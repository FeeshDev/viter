window.onload = function () {

    //! Constants and vars
    var game = new gameIO();
    var renderer = new game.renderer();
    renderer.clearScreen = false;
    var scene = new game.scene();
    var controls = new game.keyboard();
    var mouse = new game.mouse();

    window.onbeforeunload = () => { return "Are you sure you want to leave this page?" };

    // let d = false;
    // const dance = document.getElementById("dance");

    // dance.addEventListener("click", () => {
    //     d = !d;
    //     dance.style.backgroundColor = d ? "#c2c2c2" : "#ffffff";
    // });

    const TYPE_TREE = 0, TYPE_ROCK = 1, TYPE_BRONZE = 2, TYPE_SILVER = 3, TYPE_GOLD = 4;
    const BULLET_DEFAULT = 0, BULLET_SHOTGUN = 1, BULLET_SNIPER = 2, BULLET_MACHINEGUN = 3, BULLET_HUNTER = 4, BULLET_SPRAYER = 5;

    //#region Add types
    game.addType(
        "player",
        function (obj, packet) {
            obj.turrets = [];

            let nameColor = "#fff";

            switch (packet.devMode) {
                case 69420:
                    nameColor = "#fc5603";
                    break;
                case 69421:
                    nameColor = "#9b28de";
                    break;
                case 1:
                    nameColor = "#f6730b";
                    break;
                case 10002:
                    nameColor = "#7fd5ff";
                    break;
                case 3:
                    nameColor = "#ae0505";
                    break;
                default:
                    nameColor = "#fff";
                    break;
            }

            obj.playerName = new game.text(packet.playerName, 0, 0, nameColor, null, "Montserrat", 26);
            scene.add(obj.playerName, 7);
            obj.visual = new game.image(imgFromSource(`./client/images/tanks/${packet.tier}/${packet.tank}/tank.png`), 0, 0, 160 * packet.scale, 160 * packet.scale);
            scene.add(obj.visual, 1);
            obj.cannon = new game.image(imgFromSource(`./client/images/turrets/default.png`), 0, 0, 220 * packet.scale, 220 * packet.scale);
            scene.add(obj.cannon, 5);

            packet.turrets.forEach(turret => {
                let turretImg = turretSwitch(turret.type)
                let turretObj = new game.image(turretImg, 0, 0, 220 * turret.scale, 220 * turret.scale);
                turretObj.offsetX = turret.offsetX || 0;
                turretObj.offsetY = turret.offsetY || 0;
                turretObj.offsetAngle = turret.offsetAngle || 0;
                obj.turrets.push(turretObj);
                scene.add(turretObj, 3);
            });
        }
    );
    game.addType(
        "object",
        function (obj, packet) {
            let object = new Image();
            switch (packet.objType) {
                case TYPE_TREE:
                    let treeType;
                    packet.subObjType === 0 ? treeType = 'tree' : treeType = 'pine';
                    object.src = `./client/images/objects/obstacles/${treeType}${renderer.theme}.png`;
                    obj.visual = new game.image(object, 0, 0, 80 * packet.scale, 80 * packet.scale);
                    scene.add(obj.visual, 6, packet.scale);
                    break;
                case TYPE_ROCK:
                    object.src = `./client/images/objects/obstacles/rock${renderer.theme}.png`;
                    obj.visual = new game.image(object, 0, 0, 80 * packet.scale, 80 * packet.scale);
                    scene.add(obj.visual, 2, packet.scale);
                    break;
                case TYPE_BRONZE:
                    object.src = `./client/images/objects/crates/crate1.png`;
                    obj.visual = new game.image(object, 0, 0, 40 * packet.scale, 40 * packet.scale);
                    scene.add(obj.visual, 2, packet.scale);
                    break;
                case TYPE_SILVER:
                    object.src = `./client/images/objects/crates/crate2.png`;
                    obj.visual = new game.image(object, 0, 0, 40 * packet.scale, 40 * packet.scale);
                    scene.add(obj.visual, 2, packet.scale);
                    break;
                case TYPE_GOLD:
                    object.src = `./client/images/objects/crates/crate3.png`;
                    obj.visual = new game.image(object, 0, 0, 40 * packet.scale, 40 * packet.scale);
                    scene.add(obj.visual, 2, packet.scale);
                    break;
            }
        }
    );
    game.addType(
        "wall",
        function (obj, packet) {
            //obj.visual = new game.rectangle(packet.x, packet.y, packet.w, packet.h, "#000");
            //scene.add(obj.visual);
        }
    );
    game.addType(
        "bullet",
        function (obj, packet) {
            let bullet = new Image();
            switch (packet.bulletType) {
                case BULLET_DEFAULT:
                    bullet.src = `./client/images/bullets/default.png`;
                    break;
                case BULLET_SHOTGUN:
                    bullet.src = `./client/images/bullets/shotgun.png`;
                    break;
                case BULLET_SNIPER:
                    bullet.src = `./client/images/bullets/sniper.png`;
                    break;
                case BULLET_MACHINEGUN:
                    bullet.src = `./client/images/bullets/shotgun.png`;
                    break;
                case BULLET_HUNTER:
                    bullet.src = `./client/images/bullets/sniper.png`;
                    break;
                case BULLET_SPRAYER:
                    bullet.src = `./client/images/bullets/shotgun.png`;
                    break;
            }
            // obj.visual = new game.circle(packet.x, packet.y, 10 * packet.scale, "#000");
            obj.visual = new game.image(bullet, 0, 0, 30 * packet.scale, 30 * packet.scale);

            scene.add(obj.visual);
        }
    );
    //#endregion

    //@ Others
    const playGame = () => {
        if (game.ws.readyState == 1)
            game.currentPackets.push({
                type: "playPacket",
                name: document.getElementById("nameInput").value,
                branch: localStorage["branch"]
                // dance: d
            });
        setTimeout(() => {
            document.getElementById("menu").style.display = "none";
        }, 500);
        game.me.fov = 1;
        game.clientLvl = 0;
        game.clientXp = 0;
        game.actualLvl = 0;
        game.actualXp = 0;
        main();
    }

    window.r = string => {
        if (game.ws.readyState == 1)
            game.currentPackets.push({
                type: "requestCommand",
                command: string,
                accessCode: localStorage["accessCode"]
            });
    }

    document.getElementById("playButton").onclick = () => playGame();

    game.packetFunctions["setID"] = function (packet) {
        for (var i = 0; i < game.objects.length; i++) {
            if (game.objects[i].id == packet.id) {
                const oldFov = game.me.fov;
                game.me = game.objects[i];
                game.me.fov = oldFov;
            }
        }
        scene.camera.position = game.me.visual.position;
    };

    game.createSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}:${window.location.hostname}:${window.location.port || window.location.protocol === "https:" ? "443" : "80"}/ws`);

    //let img = new Image();
    //img.src = "./client/images/objects/obstacles/pine0.png"
    //let funiimage = new game.image(img, 0, 0, 30, 30);
    //renderer.UI.buttons.push(new game.button("test", 0, -100, 200, 50, 5, null, funiimage));
    //renderer.UI.buttons.push(new game.button("test2", 100, -200, 200, 50, 5, null, funitext))

    //!UI

    let scoreText = game.text("", 0, 0, "#ddd", null, "Montserrat", 20);
    renderer.addLabel(new game.label("score_behind", { x: 2, y: Math.max(1 + 0.5 - (window.innerHeight / 722 * 0.5), 1) }, 0, -160, 386, 28, 14, { color: "rgba(49, 48, 53, 0.6)" }, game.text()));
    renderer.addLabel(new game.label("score", { x: 2, y: Math.max(1 + 0.5 - (window.innerHeight / 722 * 0.5), 1) }, 0, -160, 380, 22, 11, { color: "rgba(41, 171, 58, 0.9)" }, scoreText));

    let levelText = game.text("", 0, 0, "#ddd", null, "Montserrat", 20);
    renderer.addLabel(new game.label("level_behind", { x: 2, y: Math.max(1 + 0.5 - (window.innerHeight / 722 * 0.5), 1) }, 0, -120, 426, 36, 18, { color: "rgba(49, 48, 53, 0.6)" }, game.text()));
    renderer.addLabel(new game.label("level", { x: 2, y: Math.max(1 + 0.5 - (window.innerHeight / 722 * 0.5), 1) }, 0, -120, 420, 30, 15, { color: "rgba(35, 145, 50, 0.9)" }, levelText));

    let bodies = [1, 2, 2, 2];

    for (let i = 0; i < bodies.length; i++) {
        const tier = i;
        const length = bodies[tier];
        for (let j = 0; j < length; j++) {
            const tank = j;
            let style = { fill: { default: "#29ab3a" }, stroke: { lineWidth: 4 } };
            let img = new Image();
            img.src = `./client/images/tanks/${tier}/${tank}/tank.png`;
            let funiimage = new game.image(img, 0, 0, 100, 100, 100, 0, 0, true);
            funiimage.rotation = Math.PI / 2;
            //let buttonText = game.text(`Body ${tier}:${tank}`, 0, 0, "#ddd", null, "Arial", 20);
            renderer.addButton(new game.button(`tankButton:${tier}:${tank}`, { x: 2, y: 2 }, -300 + tank * 120, 160 - tier * 120, 100, 100, 10, style, funiimage, function () {
                game.addPacket("upgradePacket", ["body", { tier: tier, tank: tank }]);
            }));
        }
    }

    /*
    let buttonText2 = game.text("Turret", 0, 0, "#ddd", null, "Arial", 20); // { fill: { default: "#707271", hover: "#696b6a" }, stroke: { default: "#575958", hover: "#4b4d4c", lineWidth: 4 } }
    renderer.addButton(new game.button("button1", -60, -200, 100, 100, 10, { fill: { default: "#707271", hover: "#646665", click: "#575958" }, stroke: { default: "#646665", hover: "#575958", click: "#4b4d4c", lineWidth: 4 } }, buttonText2, function () {
        game.addPacket("upgradePacket", ["turret", { tier: 1, turreti: 0 }]);
    }));
    */

    const statUpdate = 2000;

    let timeSinceLastFrame = Date.now();
    let nextDrawFps = Date.now() + statUpdate;
    let fpsArray = [];
    let fpsValues = [];

    //! Main Loop
    const main = () => {
        if (controls.changed) {
            controls.changed = false;
            game.addPacket("updateControls", controls);
        }
        if (mouse.changed || mouse.moved || mouse.rightChanged) {
            mouse.moved = false;
            mouse.changed = false;
            game.addPacket("updateMouse", mouse);
        }
        game.update();
        renderer.clear();
        renderer.drawEdge();
        renderer.drawBackground();
        renderer.drawGrid();
        renderer.render(scene);
        renderer.drawMinimap();
        renderer.drawLeaderboard();
        renderer.UI.render(renderer.ctx, renderer.ratio);
        game.addPacket("ping", Date.now());
        fpsArray.push(1000 / (Date.now() - timeSinceLastFrame));
        if (Date.now() > nextDrawFps) {
            fpsValues = [
                fpsArray.reduce((p, c) => p + c, 0) / fpsArray.length,
                Math.min(...fpsArray),
                Math.max(...fpsArray)
            ];
            fpsArray = [];
            game.setPingValues();
            nextDrawFps = Date.now() + statUpdate;
        }
        renderer.drawPerformance(fpsValues[0], fpsValues[1], fpsValues[2]);
        timeSinceLastFrame = Date.now();
        requestFrame(main);
    }
}