window.onload = function () {
    var game = new gameIO();
    var renderer = new game.renderer();
    renderer.clearScreen = false;
    var scene = new game.scene();
    var controls = new game.keyboard();
    var mouse = new game.mouse();

    const TYPE_TREE = 0, TYPE_ROCK = 1;
    const BULLET_DEFAULT = 0, BULLET_SHOTGUN = 1, BULLET_SNIPER = 2;

    game.addType(
        "player",
        function (obj, packet) {
            let tank = new Image();
            tank.src = `./client/images/tanks/${packet.tank}/${packet.tier}/tank.png`;
            obj.visual = new game.image(tank, 0, 0, 160 * packet.scale, 160 * packet.scale);
            let cannon = new Image();
            cannon.src = `./client/images/cannons/cannon.png`;
            obj.cannon = new game.image(cannon, 0, 0, 220 * packet.scale, 220 * packet.scale);
            scene.add(obj.visual, 1);
            scene.add(obj.cannon, 5);
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
                    scene.add(obj.visual, 20, packet.scale);
                    break;
                case TYPE_ROCK:
                    object.src = `./client/images/objects/obstacles/rock${renderer.theme}.png`;
                    obj.visual = new game.image(object, 0, 0, 80 * packet.scale, 80 * packet.scale);
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
            }
            // obj.visual = new game.circle(packet.x, packet.y, 10 * packet.scale, "#000");
            obj.visual = new game.image(bullet, 0, 0, 30 * packet.scale, 30 * packet.scale);
            scene.add(obj.visual);
        }
    );
    game.packetFunctions["setID"] = function (packet) {
        for (var i = 0; i < game.objects.length; i++) {
            if (game.objects[i].id == packet.id) {
                game.me = game.objects[i];
            }
        }
        scene.camera.position = game.me.visual.position;
    };
    game.createSocket("ws://localhost:80/ws");
    window.crateSock = (sock) => {
        game.createSocket(sock);
    }
    function main() {
        if (controls.changed) {
            controls.changed = false;
            if (game.ws.readyState == 1)
                game.currentPackets.push({ type: "updateControls", object: controls });
        }
        if (mouse.changed || mouse.moved || mouse.rightChanged) {
            mouse.moved = false;
            mouse.changed = false;
            if (game.ws.readyState == 1)
                game.currentPackets.push({ type: "updateMouse", object: mouse });
        }
        game.update();
        renderer.clear();
        renderer.drawEdge();
        renderer.drawBackground();
        renderer.drawGrid();
        renderer.render(scene);
        renderer.drawMinimap();
        renderer.drawObjects();
        requestFrame(main);
    }
    main();
}