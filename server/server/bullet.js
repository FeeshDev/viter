let bullets = [
    {   //* DEFAULT
        type: 0,
        damage: 5,
        extraSpeed: 1,
        extraLifespan: 1,
        scale: 1,
    },
    {   //* SHOTGUN PELLET
        type: 1,
        damage: 1.5,
        extraSpeed: 0.9,
        extraLifespan: 0.6,
        scale: 0.6,
    },
    {   //* SNIPER BULLET
        type: 2,
        damage: 10,
        extraSpeed: 2,
        extraLifespan: 2,
        scale: 1,
    },
    {   //* MACHINE GUN PELLET
        type: 3,
        damage: 2.5,
        extraSpeed: 1,
        extraLifespan: 1,
        scale: 0.65,
    },
]

game.addType(
    // Type
    "bullet",
    // Create
    function (obj, extra) {
        //extra = { pos[], angle }
        let bulletProps = bullets[extra.type];
        obj.bulletType = bulletProps.type;
        obj.scale = bulletProps.scale;

        obj.body = new game.body(0);
        obj.body.type = 5;
        obj.body.angle = extra.angle;
        obj.body.addShape(new game.circle(10 * obj.scale));

        obj.lifespan = 0;
        obj.lifespanCap = 40 * bulletProps.extraLifespan;

        obj.damage = bulletProps.damage;

        obj.extraSpeed = bulletProps.extraSpeed;
        if (obj.bulletType === 1) obj.extraSpeed = obj.extraSpeed * 0.7 + obj.extraSpeed * Math.random();

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
    obj.body.velocity[0] = -Math.cos(obj.body.angle) * 600 * obj.extraSpeed;
    obj.body.velocity[1] = -Math.sin(obj.body.angle) * 600 * obj.extraSpeed;
}

game.addCollision('bullet', 'object', (bullet, object) => {
    game.remove(bullet);
    object.health -= bullet.damage;
    if (object.health <= 0) {
        switch (object.objType) {
            // Tree
            case 0: 
                game.findObjectById(bullet.ownerID).xp += 10 + Math.round((object.scale - 1) / 1 * 10);
                break;

            // Rock
            case 1:
                game.findObjectById(bullet.ownerID).xp += 20 + Math.round((object.scale - 1) / 0.5 * 10);
                break;
        }
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
            let scoreToGive = Math.min(
                Math.max(
                    Math.round(them.xp * (0.5 * (them.level / (you.level || 1)))),
                    them.xp * 0.1
                ),
                them.xp * 0.9
            );
            if (them.level === 60 && you.xp + scoreToGive < 50623) scoreToGive = 50623 - you.xp;
            game.findObjectById(bullet.ownerID) += scoreToGive;
            
        } else player.regen = Date.now() + 20000; // next regen in 20 s
    }
});