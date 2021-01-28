game.addType(
    // Type
    "bullet",
    // Create
    function (obj, extra) {
        obj.bulletType = extra.type;

        obj.damage = extra.damage;
        obj.scale = extra.scale;
        obj.bulletSpeedMult = extra.bulletSpeedMult;
        if (obj.bulletType === 1) obj.bulletSpeedMult = obj.bulletSpeedMult * 0.7 + obj.bulletSpeedMult * Math.random();

        obj.lifespan = 0;
        obj.lifespanCap = 40 * extra.lifespanMult;

        obj.body = new game.body(0);
        obj.body.type = 5;
        obj.body.angle = extra.angle;
        obj.body.addShape(new game.circle(10 * obj.scale));

        obj.ownerID = extra.ownerID;
        obj.body.position = extra.pos//[extra.pos[0] - Math.cos(obj.body.angle) * 20, extra.pos[1] - Math.sin(obj.body.angle) * 20];
        obj.needsUpdate = true;
    },
    // Tick Update
    function (obj) {
        handleMovement(obj);
        obj.lifespan++;
        if (obj.lifespan >= obj.lifespanCap) game.remove(obj);

        obj.body.owner = obj;
    },
    // Packet Update
    function (obj, packet) {
        packet.angle = obj.body.angle;
    },
    // Add
    function (obj, packet) {
        packet.x = obj.body.position[0];
        packet.y = obj.body.position[1];
        packet.angle = obj.body.angle;
        packet.bulletType = obj.bulletType;
        packet.scale = obj.scale;
    }
);

const handleMovement = (obj) => {
    obj.body.velocity[0] = -Math.cos(obj.body.angle) * 600 * obj.bulletSpeedMult;
    obj.body.velocity[1] = -Math.sin(obj.body.angle) * 600 * obj.bulletSpeedMult;
}

game.addCollision('bullet', 'object', (bullet, object) => {
    game.remove(bullet);
    object.health -= bullet.damage;
    if (object.health <= 0 && game.findObjectById(bullet.ownerID).lastDestroyed !== object.id) {
        switch (object.objType) {
            // Tree
            case 0:
                game.findObjectById(bullet.ownerID).xp += 10 + Math.round((object.scale - 1) / 1 * 10);
                break;

            // Rock
            case 1:
                game.findObjectById(bullet.ownerID).xp += 40 + Math.round((object.scale - 1) / 0.5 * 10);
                break;
        }
        game.findObjectById(bullet.ownerID).lastDestroyed = object.id;
    }
});

game.addCollision('bullet', 'wall', (bullet, wall) => {
    game.remove(bullet);
});

game.addCollision('bullet', 'player', (bullet, player) => {
    if (bullet.ownerID !== player.id) {
        game.remove(bullet);
        player.health -= bullet.damage;
        if (player.health <= 0) {
            const you = game.findObjectById(bullet.ownerID);
            const them = game.findObjectById(player.id);
            let scoreToGive = Math.round(
                Math.min(
                    Math.max(
                        Math.round(them.xp * (0.5 * (them.level / (you.level || 1)))),
                        them.xp * 0.1
                    ),
                    them.xp * 0.9
                )
            );
            if (them.level === 60 && you.xp + scoreToGive < 50623) scoreToGive = 50623 - you.xp;
            game.findObjectById(bullet.ownerID).xp += scoreToGive;

        } else player.regen = Date.now() + 20000; // next regen in 20 s
    }
});