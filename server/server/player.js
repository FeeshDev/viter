const DEFAULT_SCALE = 0.5;

let hitboxes = [{ w: 180, h: 210 }, { w: 150, h: 150 }, { w: 214, h: 200 }];

const bullets = [1, 0.6, 1, 0.65]; // bullet scales

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
];

/**
 * Generates a turret object.
 * @param {number} type The turret type.
 * @param {number} maxCD Millliseconds between shots.
 * @param {number=} offsetX X offset. In pixels.
 * @param {number=} offsetY Y offset. In pixels.
 * @param {number=} offsetAngle Angle offset. Clockwise in radians.
 */
function t(type, maxCD, offsetX = 0, offsetY = 0, offsetAngle = 0) {
    let l;
    switch(type) {
        case 0: 
            l = 41.8
            break;
        case 2:
            l = 51.04;
            break;

        // Shotgun and machine gun have the same length
        default: 
            l = 32.56
            break;
    }
    let bs = bullets[type];
    return {
        type: type,
        turretCD: 0,
        turretMaxCD: maxCD,
        length: l,
        bulletSize: bs,
        distance: Math.sqrt(Math.abs(offsetX) * 2 + Math.abs(offsetY + l - bs) * 2),
        turretAngle: Math.atan2(-offsetY - l + bs, offsetX),
        offsetX: offsetX,
        offsetY: offsetY,
        offsetAngle: offsetAngle
    };
}

// let turrets = [
//     [{ type: 0, turretCD: 0, turretMaxCD: 10 }], //* Default
//     [{ type: 1, turretCD: 0, turretMaxCD: 15 }], //* Shotgun
//     [{ type: 2, turretCD: 0, turretMaxCD: 20 }], //* Sniper
//     [{ type: 3, turretCD: 0, turretMaxCD: 3 }], //* Machine Gun
//     [{ type: 0, turretCD: 0, turretMaxCD: 10, offsetX: -10 }, { type: 0, turretCD: 0, turretMaxCD: 10, offsetX: 10 }], //* Twin
//     [{ type: 0, turretCD: 0, turretMaxCD: 10, offsetX: -10 }, { type: 0, turretCD: 0, turretMaxCD: 10, offsetX: 10 }, { type: 0, turretCD: 0, turretMaxCD: 10, offsetY: 10 }], //* Triplet
//     [{ type: 1, turretCD: 0, turretMaxCD: 10, offsetX: -4, offsetAngle: Math.PI / 10 }, { type: 1, turretCD: 0, turretMaxCD: 10, offsetX: 4, offsetAngle: -Math.PI / 10 }, { type: 1, turretCD: 0, turretMaxCD: 10, offsetY: 10 }], //* Shotgun Triplet
//     [{ type: 2, turretCD: 0, turretMaxCD: 10, offsetX: -20, offsetAngle: -Math.PI / 20 }, { type: 2, turretCD: 0, turretMaxCD: 10, offsetX: 20, offsetAngle: Math.PI / 20 }, { type: 2, turretCD: 0, turretMaxCD: 10, offsetY: 10 }], //* Focused Sniper
//     [{ type: 3, turretCD: 0, turretMaxCD: 2, offsetY: 20 }, { type: 3, turretCD: 0, turretMaxCD: 2 }] //* Sprayer
// ]

let turrets = [
    [t(0, 10)], //* Default
    [t(1, 15)], //* Shotgun
    [t(2, 20)], //* Sniper
    [t(3, 3)], //* Machine Gun
    [t(0, 10, -10), t(0, 10, 10)], //* Twin
    [t(0, 10, -20), t(0, 10, 20), t(0, 10, 0, 10)], //* Triplet
    [t(1, 10, -4, 0, Math.PI / 10), t(1, 10, 4, 0, -Math.PI / 10), t(1, 10, 0, 10)], //* Shotgun Triplet
    [t(2, 10, -10, 0, -0.03), t(2, 10, 10, 0, 0.03), t(2, 10, 0, 0)], //* Focused Sniper
    [t(3, 2, 0, 20), t(3, 2)] //* Sprayer
]

game.addType(
    // Type
    "player",
    // Create
    function (obj, extra) {
        //@ Body and basics
        obj.body = new game.body(0.8);
        obj.body.position = [getRandomInt(0, MAP_SIZE), getRandomInt(0, MAP_SIZE)];
        obj.body.type = 1;

        obj.name = extra.name.slice(0, 20);
        obj.devID = extra.devID;

        switch (obj.devID) {
            case "3CkhWrJQeR3svJHs8VXz": //! Alez
                obj.name = "> Alez - Developer <";
                obj.devMode = 1;
                break;
            case "TUnSbTafPZgu7yfckH3m": //* Gark
                obj.name = "> Garklein - Developer <";
                obj.devMode = 2;
                break;
        }


        //!TANK
        obj.health = 100;
        obj.maxHealth = 100;
        obj.tank = 0;
        obj.tier = 0;

        obj.tank === 0 ? obj.tier = 0 : null;
        obj.props = tankProps[obj.tank][obj.tier];

        //!SHOOTING
        obj.turretIndex = 1;
        obj.turrets = [];
        turrets[obj.turretIndex].forEach((t, i) => {
            obj.turrets.push({});
            for (const prop in t) obj.turrets[i][prop] = t[prop];
        });
        // obj.turrets = [{ type: 2, offsetX: -10, offsetY: -5, offsetAngle: Math.PI / 12, turretCD: 0, turretMaxCD: 10 }, { type: 2, offsetX: 10, offsetY: -5, offsetAngle: -Math.PI / 12, turretCD: 0, turretMaxCD: 10  }, { type: 2, offsetX: -6, offsetY: 0, offsetAngle: Math.PI / 16, turretCD: 0, turretMaxCD: 10  }, { type: 2, offsetX: 6, offsetY: 0, offsetAngle: -Math.PI / 16, turretCD: 0, turretMaxCD: 10  }, { type: 2, offsetX: 0, offsetY: 10, offsetAngle: 0, turretCD: 0, turretMaxCD: 10 }];

        //? Others
        obj.body.addShape(new game.rectangle(obj.props.hitbox.h * DEFAULT_SCALE * obj.props.tankSize, obj.props.hitbox.w * DEFAULT_SCALE * obj.props.tankSize));
        obj.body.damping = 0.9;
        obj.direction = 0;
        obj.playerInput = new game.playerInput();
        obj.needsUpdate = true;
        obj.playerMouse = { angle: 0 };
        obj.startingTime = Date.now();
        obj.regen = Date.now();

        obj.handleHitbox = () => {
            obj.props = tankProps[obj.tank][obj.tier];
            obj.body.shapes[0] = new game.rectangle(obj.props.hitbox.h * DEFAULT_SCALE * obj.props.tankSize, obj.props.hitbox.w * DEFAULT_SCALE * obj.props.tankSize);
        }

        obj.updateTurrets = () => {
            obj.turrets = [];
            turrets[obj.turretIndex].forEach((t, i) => {
                obj.turrets.push({});
                for (const prop in t) obj.turrets[i][prop] = t[prop];
            });
        }
    },
    // Tick Update
    function (obj) {
        //obj.health = Math.max(Math.min(obj.health + 0.1, 100), 0);
        obj.body.angularVelocity = 0;
        obj.body.angularForce = 0;

        if (obj.health <= 0) { 
            game.remove(obj); obj.type = 'spectator'; 
            obj.death(obj.startingTime); 
            obj = undefined 
        }

        if (Date.now() > obj.regen) obj.health = Math.min(obj.health + 0.3, obj.maxHealth);

        obj.body.angle = obj.direction * (Math.PI / 180);
        handleMovement(obj);

        obj.turrets.forEach(turret => {
            if (turret.turretCD > 0) turret.turretCD--;
        });
        if (obj.playerMouse.clicking) shoot(obj);

    },
    // Packet Update
    function (obj, packet) {
        packet.health = obj.health;
        packet.tank = obj.tank;
        packet.tier = obj.tier;
        packet.angle = obj.playerMouse.angle;

        packet.turrets = obj.turrets;
    },
    // Add
    function (obj, packet) {
        packet.health = obj.health;
        packet.maxHealth = obj.maxHealth;
        packet.tank = obj.tank;
        packet.tier = obj.tier;
        packet.w = obj.body.shapes[0].width;
        packet.h = obj.body.shapes[0].height;
        packet.scale = obj.props.tankSize;
        packet.angle = obj.playerMouse.angle;

        packet.turrets = obj.turrets;
        packet.playerName = obj.name;
        packet.devMode = obj.devMode;
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
    obj.turrets.forEach(turret => {
        if (turret.turretCD !== 0) return;
        let angleScale = 3.1;
        let bulletAngle = obj.playerMouse.angle + turret.offsetAngle;
        let finalPosition = {
            x: Math.sin(2 * Math.PI - obj.playerMouse.angle + turret.turretAngle) * turret.distance,
            y: Math.cos(2 * Math.PI - obj.playerMouse.angle + turret.turretAngle) * turret.distance
        }
        switch (turret.type) {

            // Shotgun
            case 1:
                for (let i = 0; i < 6; i++) {
                    let spread = Math.random() * (Math.PI / 8);
                    let sign = (Math.random() > 0.5) ? 1 : -1;
                    bulletAngle = bulletAngle - (spread * sign) / 2;
                    game.create("bullet", { type: turret.type, pos: [obj.body.position[0] + finalPosition.x * angleScale, obj.body.position[1] + finalPosition.y * angleScale], angle: bulletAngle, velocity: obj.body.velocity, ownerID: obj.id });
                }
                break;

            // Machine Gun
            case 3:
                let spread = Math.random() * (Math.PI / 4);
                let sign = (Math.random() > 0.5) ? 1 : -1;
                bulletAngle = bulletAngle - (spread * sign) / 2;
                game.create("bullet", { type: turret.type, pos: [obj.body.position[0] + finalPosition.x * angleScale, obj.body.position[1] + finalPosition.y * angleScale], angle: bulletAngle, velocity: obj.body.velocity, ownerID: obj.id });
                break;
                
            default:
                game.create("bullet", { type: turret.type, pos: [obj.body.position[0] + finalPosition.x * angleScale, obj.body.position[1] + finalPosition.y * angleScale], angle: bulletAngle, velocity: obj.body.velocity, ownerID: obj.id });
                break
        }
        turret.turretCD = turret.turretMaxCD;
    });
}