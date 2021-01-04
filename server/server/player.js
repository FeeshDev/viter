const DEFAULT_SCALE = 0.5;

let hitboxes = [{ w: 180, h: 210 }, { w: 150, h: 150 }, { w: 214, h: 200 }];

let tankProps = [
    [ //* Tank 0
        { //* Tier 0
            //* Default - 0.0
            hitbox: hitboxes[0],
            speedMod: 1,
            healthMod: 1,
            tankSize: 1,
        }
    ],
    [ //* Tank 1
        { //* Tier 0
            //* Serpent MK I - 1.0
            hitbox: hitboxes[1],
            speedMod: 1.2,
            healthMod: 1,
            tankSize: 1,
        },
        { //* Tier 1
            //* Serpent MK II - 1.1
            hitbox: hitboxes[1],
            speedMod: 1.4,
            healthMod: 0.8,
            tankSize: 1,
        },
        { //* Tier 2
            //* Basilisk - 1.2
            hitbox: hitboxes[1],
            speedMod: 2,
            healthMod: 0.5,
            tankSize: 1,
        },
        { //* Tier 3
            //* Basilisk - 1.3
            hitbox: hitboxes[1],
            speedMod: 4,
            healthMod: 999,
            tankSize: 10,
        }
    ],
    [ //* Tank 2
        { //* Tier 0
            //* Squire MK I - 2.0
            hitbox: hitboxes[0],
            speedMod: 1,
            healthMod: 1.2,
            tankSize: 1,
        },
        { //* Tier 1
            //* Squire MK II - 2.1
            hitbox: hitboxes[2],
            speedMod: 0.8,
            healthMod: 1.4,
            tankSize: 1,
        },
        { //* Tier 2
            //* Knight - 2.2
            hitbox: hitboxes[2],
            speedMod: 0.6,
            healthMod: 2,
            tankSize: 1,
        }
    ],
]

game.addType(
    // Type
    "player",
    // Create
    function (obj, extra) {
        obj.body = new game.body(0.8);
        obj.body.position = [1500, 1500];
        obj.body.type = 1;

        //!TANK
        obj.health = 100;
        obj.tank = 0;
        obj.tier = 0;

        obj.tank === 0 ? obj.tier = 0 : null;
        obj.props = tankProps[obj.tank][obj.tier];

        //!SHOOTING
        obj.shootCooldown = 0;
        obj.maxCooldown = 5;

        //? Others
        obj.body.addShape(new game.rectangle(obj.props.hitbox.h * DEFAULT_SCALE * obj.props.tankSize, obj.props.hitbox.w * DEFAULT_SCALE * obj.props.tankSize));

        obj.body.damping = 0.9;
        obj.direction = 0;
        obj.playerInput = new game.playerInput();
        obj.needsUpdate = true;
        obj.playerMouse = { angle: 0 };
    },
    // Tick Update
    function (obj) {
        obj.shootCooldown <= 0 ? null : obj.shootCooldown--
        //obj.health = Math.max(Math.min(obj.health + 0.1, 100), 0);
        obj.body.angularVelocity = 0;
        obj.body.angularForce = 0;

        obj.body.angle = obj.direction * (Math.PI / 180);
        handleMovement(obj);

        if (obj.playerMouse.clicking) shoot(obj);

        if (obj.health <= 0) {
            game.clients.forEach(client => {
                if (client.self.id === obj.id) {
                    game.remove(client.self);
                    client.self = game.create('player');
                }
            });
        }
    },
    // Packet Update
    function (obj, packet) {
        packet.tank = obj.tank;
        packet.tier = obj.tier;
        packet.angle = obj.playerMouse.angle;
    },
    // Add
    function (obj, packet) {
        packet.tank = obj.tank;
        packet.tier = obj.tier;
        packet.w = obj.body.shapes[0].width;
        packet.h = obj.body.shapes[0].height;
        packet.scale = obj.props.tankSize;
        packet.angle = obj.playerMouse.angle;
    }
);

const handleHitbox = (obj) => {
    obj.body.shapes[0] = new game.rectangle(obj.props.hitbox.h * DEFAULT_SCALE * obj.scale, obj.props.hitbox.w * DEFAULT_SCALE * obj.scale);
}

const handleMovement = (obj) => {
    if (obj.playerInput.up) {
        obj.body.velocity[1] = -400 * obj.props.speedMod;
        obj.body.velocity[0] = 0;
        if (obj.direction !== 90) obj.direction = 270;
    } else if (obj.playerInput.down) {
        obj.body.velocity[1] = 400 * obj.props.speedMod;
        obj.body.velocity[0] = 0;
        if (obj.direction !== 270) obj.direction = 90;
    } else if (obj.playerInput.left) {
        obj.body.velocity[1] = 0;
        obj.body.velocity[0] = -400 * obj.props.speedMod;
        if (obj.direction !== 0) obj.direction = 180;
    } else if (obj.playerInput.right) {
        obj.body.velocity[1] = 0;
        obj.body.velocity[0] = 400 * obj.props.speedMod;
        if (obj.direction !== 180) obj.direction = 0;
    } else {
        if (!obj.playerInput.up) { obj.body.velocity[1] = 0.2; }
        if (!obj.playerInput.down) { obj.body.velocity[1] = 0.2; }
        if (!obj.playerInput.left) { obj.body.velocity[0] = 0.2; }
        if (!obj.playerInput.right) { obj.body.velocity[0] = 0.2; }
    }
}

const shoot = (obj) => {
    if (obj.shootCooldown === 0) {
        game.create("bullet", { type: 2, pos: obj.body.position, angle: obj.playerMouse.angle, velocity: obj.body.velocity, ownerID: obj.id });
        obj.shootCooldown = obj.maxCooldown;
    }
}