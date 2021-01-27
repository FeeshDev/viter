const DEFAULT_SCALE = 0.5;

let hitboxes = [{ w: 180, h: 210 }, { w: 150, h: 150 }, { w: 214, h: 200 }];

const bullets = [1, 0.6, 1, 0.65]; // bullet scales

const directions = ["up", "left", "down", "right"];
const dirIndex = {
    "up": 0,
    "left": 1,
    "down": 2,
    "right": 3
};

let l = []; // level thresholds
for (let i = 0; i < 61; i++) l.push(Math.ceil(Math.pow((i + 1), 2.635)));

class Body {
    /**
     * Generates a tank body
     * @param {number} hitboxIndex the index of the hitbox
     * @param {number} speedMod speed multiplier
     * @param {number=} healthMod health multiplier
     * @param {number=} scale size multiplier
     */
    constructor(hitboxIndex, speedMod, healthMod = 1, scale = 1) {
        this.hitbox = hitboxes[hitboxIndex];
        this.speedMod = speedMod;
        this.healthMod = healthMod;
        this.tankSize = scale;
    }
}

let tankBodies = [
    [ //* Tier 0
        //* Tank 0
        new Body(0, 1, 1, 1) //* Default - 0.0
    ],
    [ //* Tier 1
        //* Tank 0
        new Body(1, 1.2, 1, 1), //* Serpent MK I - 1.0
        //* Tank 1
        new Body(0, 1, 1.2, 1), //* Squire MK I - 2.0
    ],
    [ //* Tier 2
        //* Tank 0
        new Body(1, 1.4, 0.8, 1), //* Serpent MK II - 1.1
        //* Tank 1
        new Body(2, 0.8, 1.4, 1), //* Squire MK II - 2.1
    ],
    [ //* Tier 3
        //* Tank 0
        new Body(1, 2, 0.5, 1), //* Basilisk - 1.2
        //* Tank 1
        new Body(1, 0.6, 2, 1), //* Knight - 2.2
    ]
];


class Turret {
    /**
     * Generates a turret object.
     */
    constructor({ type, maxCD, dmg, offsetX = 0, offsetY = 0, offsetAngle = 0, bulletScale = 1, bulletSpeedMult = 1, lifespanMult = 1 }) {
        let l;
        switch (type) {
            case 0:
                l = 41.8;
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
        let bulletYOffset = l - bs;
        this.type = type;
        this.turretCD = 0;
        this.turretMaxCD = maxCD;
        this.length = l;
        this.bulletSize = bs;
        this.distance = Math.sqrt(Math.pow(Math.abs(offsetX), 2) + Math.pow(Math.abs(offsetY + bulletYOffset), 2));
        this.turretAngle = Math.atan2(-offsetY - bulletYOffset, offsetX);
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.offsetAngle = offsetAngle;
        this.bulletDmg = dmg;
        this.bulletScale = bulletScale;
        this.bulletSpeedMult = bulletSpeedMult;
        this.lifespanMult = lifespanMult;
    }
}

const turrets = [
    [ // tier 0
        [new Turret({ type: 0, maxCD: 10, dmg: 5 })] // default
    ],
    [ // tier 1
        [new Turret({ type: 2, maxCD: 20, dmg: 10, bulletSpeedMult: 2, lifespanMult: 2 })], // sniper
        [new Turret({ type: 3, maxCD: 3, dmg: 2.5, bulletScale: 0.65 })], // machine gun
        [
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetX: -10 }), // twin
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetX: 10 })
        ]
    ],
    [ // tier 2
        [new Turret({ type: 2, maxCD: 15, dmg: 15, bulletSpeedMult: 2, lifespanMult: 2 })], // hunter
        [
            new Turret({ type: 3, maxCD: 2, dmg: 2.5, offsetY: 20, bulletScale: 0.65 }), // sprayer
            new Turret({ type: 3, maxCD: 2, dmg: 2.5, bulletScale: 0.65 })
        ],
        [new Turret({ type: 2, maxCD: 15, dmg: 1.5, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6 })], // shotgun
        [
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetX: -10 }), // twinner (better twin)
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetX: 10 })
        ]
    ],
    [ // tier 3
        [new Turret({ type: 2, maxCD: 14, dmg: 20, bulletSpeedMult: 2, lifespanMult: 2 })], // predator
        [
            new Turret({ type: 2, maxCD: 15, dmg: 1.5, offsetX: -7, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6 }), // Scatterer (twin shotgun)
            new Turret({ type: 2, maxCD: 15, dmg: 1.5, offsetX: 7, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6 })
        ],
        [
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetX: -20 }), // triplet
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetX: 20 }),
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetY: 10 })
        ],
        [] // gunner (not made yet)
    ],
    [ // tier 4
        [
            new Turret({ type: 2, maxCD: 10, dmg: 10, offsetX: -10, offsetAngle: -Math.PI / 100, bulletSpeedMult: 2, lifespanMult: 2 }), // Focused Sniper
            new Turret({ type: 2, maxCD: 10, dmg: 10, offsetX: 10, offsetAngle: Math.PI / 100, bulletSpeedMult: 2, lifespanMult: 2 }),
            new Turret({ type: 2, maxCD: 10, dmg: 10, bulletSpeedMult: 2, lifespanMult: 2 })
        ],
        [
            new Turret({ type: 1, maxCD: 10, dmg: 1.5, offsetX: -4, offsetAngle: -Math.PI / 10, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6 }), // Scattershot (shotgun triplet)
            new Turret({ type: 1, maxCD: 10, dmg: 1.5, offsetX: 4, offsetAngle: Math.PI / 10, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6 }),
            new Turret({ type: 1, maxCD: 10, dmg: 1.5, offsetY: 10, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6 })
        ],
        [
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetX: -20 }), // Trifecta (better triplet)
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetX: 20 }),
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetY: 10 })
        ],
        [] // gatling gun (better gunner) (copy paste gunner but more dmg)
    ]
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
        obj.props = tankBodies[obj.tier][obj.tank];

        //!SHOOTING
        obj.turretTier = 0;
        obj.turretIndex = 0;
        obj.turrets = [];
        turrets[obj.turretTier][obj.turretIndex].forEach((t, i) => {
            obj.turrets.push({});
            for (const prop in t) obj.turrets[i][prop] = t[prop];
        });
        // obj.turrets = [{ type: 2, offsetX: -10, offsetY: -5, offsetAngle: Math.PI / 12, turretCD: 0, turretMaxCD: 10 }, { type: 2, offsetX: 10, offsetY: -5, offsetAngle: -Math.PI / 12, turretCD: 0, turretMaxCD: 10  }, { type: 2, offsetX: -6, offsetY: 0, offsetAngle: Math.PI / 16, turretCD: 0, turretMaxCD: 10  }, { type: 2, offsetX: 6, offsetY: 0, offsetAngle: -Math.PI / 16, turretCD: 0, turretMaxCD: 10  }, { type: 2, offsetX: 0, offsetY: 10, offsetAngle: 0, turretCD: 0, turretMaxCD: 10 }];

        //!MOVEMENT
        obj.direction = 0;
        obj.playerInput = new game.playerInput();
        obj.dirArray = [];
        obj.dirString = "falsefalsefalsefalse";
        // obj.dance = extra.dance;
        obj.dance = false;

        //!LEVELS
        obj.xp = 60000;
        obj.level = 0;
        obj.levelThreshold = l[0];

        //? Others
        obj.body.addShape(new game.rectangle(obj.props.hitbox.h * DEFAULT_SCALE * obj.props.tankSize, obj.props.hitbox.w * DEFAULT_SCALE * obj.props.tankSize));
        obj.body.damping = 0.9;
        obj.needsUpdate = true;
        obj.playerMouse = { angle: 0 };
        obj.startingTime = Date.now();
        obj.regen = Date.now();
        obj.lastDestroyed = undefined;

        obj.handleHitbox = () => {
            obj.props = tankBodies[obj.tier][obj.tank];
            obj.body.shapes[0] = new game.rectangle(obj.props.hitbox.h * DEFAULT_SCALE * obj.props.tankSize, obj.props.hitbox.w * DEFAULT_SCALE * obj.props.tankSize);
        }

        obj.updateTurrets = () => {
            obj.turrets = [];
            turrets[obj.turretTier][obj.turretIndex].forEach((t, i) => {
                obj.turrets.push({});
                for (const prop in t) obj.turrets[i][prop] = t[prop];
            });
        }

        obj.upgradeBody = (data) => {
            let tier = data.tier;
            let tank = data.tank;
            if (tier === 0) return;
            if (tier - obj.tier > 1) return;
            if (obj.tank !== 0) if (obj.tank !== tank) return;
            if (obj.level < (tier * 10 + (tier - 1) * 10)) return;
            if (tier <= obj.tier) return;
            obj.tier = tier;
            obj.tank = tank;
            obj.handleHitbox();
        }

        obj.upgradeTurret = (data) => {
            let tier = data.tier;
            let turreti = data.turreti;
            if (tier === 0) return;
            if (tier - obj.tier > 1) return;
            //if (obj.tank !== 0) if (obj.tank !== tank) return;
            if (obj.level < tier * 10) return;
            if (tier <= obj.turretTier) return;
            obj.turretTier = tier;
            obj.turretIndex = turreti;
            obj.updateTurrets();
        }
    },
    // Tick Update
    function (obj) {
        //obj.health = Math.max(Math.min(obj.health + 0.1, 100), 0);
        obj.body.angularVelocity = 0;
        obj.body.angularForce = 0;

        if (obj.health <= 0) {
            obj.death(obj.startingTime, obj.xp, obj.level);
            game.remove(obj);
            obj = undefined;
            return;
        }

        if (obj.xp >= obj.levelThreshold) {
            if (obj.level !== 60) {
                while (obj.xp >= obj.levelThreshold) {
                    obj.level++;
                    obj.levelThreshold = l[obj.level];
                }
                if (obj.level > 60) obj.level = 60;
            }
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

        packet.xp = obj.xp;
        packet.level = obj.level;
        packet.lvlPercent = obj.level === 60 ? 1 : ((obj.xp - l[obj.level - 1]) / (l[obj.level] - l[obj.level - 1]) || 0);

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

const handleMovement = obj => {
    let nextDir = `${obj.playerInput.up}${obj.playerInput.down}${obj.playerInput.left}${obj.playerInput.right}`;
    if (obj.dirString !== nextDir) {
        let keysToSubtract = [];
        let keysToAdd = [];
        let keysDown = {
            up: obj.playerInput.up,
            down: obj.playerInput.down,
            left: obj.playerInput.left,
            right: obj.playerInput.right,
        };
        let oldKeysDown = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        obj.dirArray.forEach(d => oldKeysDown[d] = true);
        for (const key in keysDown) {
            if (keysDown[key]) {
                if (!oldKeysDown[key]) keysToAdd.push(key);
            } else if (oldKeysDown[key]) keysToSubtract.push(key);
        }
        if (keysToSubtract.length) {
            let indexesToSplice = [];
            obj.dirArray.forEach((d, i) => {
                keysToSubtract.forEach(k => {
                    if (k === d) indexesToSplice.push(i);
                });
            });

            indexesToSplice.forEach((d, i) => {
                obj.dirArray.splice(d - i, 1);
            });
        }
        if (keysToAdd.length) keysToAdd.forEach(k => obj.dirArray.push(k));
        obj.dirString = nextDir;
    }
    if (!obj.dirArray.length || obj.dirArray.length === 4 || (obj.dirArray.length === 2 && dirIndex[obj.dirArray[0]] === (dirIndex[obj.dirArray[1]] + 2) % 4)) {
        obj.body.velocity[1] = 0.2;
        obj.body.velocity[0] = 0.2;
    } else {
        minus = 1;
        if (obj.playerInput[
            directions[
            (dirIndex[
                obj.dirArray[obj.dirArray.length - 1]
            ] + 2) % 4
            ]
        ]) minus++;
        let way = 0, sign = 1;
        if (
            obj.dirArray[obj.dirArray.length - minus] === "up"
            ||
            obj.dirArray[obj.dirArray.length - minus] === "down"
        ) way = 1;
        if (
            obj.dirArray[obj.dirArray.length - minus] === "up"
            ||
            obj.dirArray[obj.dirArray.length - minus] === "left"
        ) sign = -1;
        obj.body.velocity[way] = sign * 400 * obj.props.speedMod;
        obj.body.velocity[~~!way] = 0;

        if (obj.dance) {
            obj.direction = (90 * way + ((sign === 1) ? 0 : 180)) % 360;
        } else {
            if (obj.direction !== (90 * way + ((sign === 1) ? 180 : 0)) % 360) obj.direction = (90 * way + ((sign === 1) ? 0 : 180)) % 360;
        }
    }
}

const shoot = (obj) => {
    obj.turrets.forEach(turret => {
        if (turret.turretCD !== 0) return;
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
                    game.create("bullet", {
                        type: turret.type,
                        pos: [obj.body.position[0] + finalPosition.x, obj.body.position[1] + finalPosition.y],
                        angle: bulletAngle,
                        velocity: obj.body.velocity,
                        ownerID: obj.id,
                        damage: turret.bulletDmg,
                        scale: turret.bulletScale,
                        bulletSpeedMult: turret.bulletSpeedMult,
                        lifespanMult: turret.lifespanMult
                    });
                }
                break;

            // Machine Gun
            case 3:
                let spread = Math.random() * (Math.PI / 4);
                let sign = (Math.random() > 0.5) ? 1 : -1;
                bulletAngle = bulletAngle - (spread * sign) / 2;
                game.create("bullet", {
                    type: turret.type, pos: [obj.body.position[0] + finalPosition.x,
                    obj.body.position[1] + finalPosition.y],
                    angle: bulletAngle,
                    velocity: obj.body.velocity,
                    ownerID: obj.id,
                    damage: turret.bulletDmg,
                    scale: turret.bulletScale,
                    bulletSpeedMult: turret.bulletSpeedMult,
                    lifespanMult: turret.lifespanMult
                });
                break;

            default:
                game.create("bullet", {
                    type: turret.type,
                    pos: [obj.body.position[0] + finalPosition.x,
                    obj.body.position[1] + finalPosition.y],
                    angle: bulletAngle,
                    velocity: obj.body.velocity,
                    ownerID: obj.id,
                    damage: turret.bulletDmg,
                    scale: turret.bulletScale,
                    bulletSpeedMult: turret.bulletSpeedMult,
                    lifespanMult: turret.lifespanMult
                });
                break
        }
        turret.turretCD = turret.turretMaxCD;
    });
}