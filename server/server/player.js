const v8 = require('v8'); // for deep copies

const DEFAULT_SCALE = 0.5;

let hitboxes = [{ w: 180, h: 210 }, { w: 150, h: 150 }, { w: 214, h: 200 }];

const directions = ["up", "left", "down", "right"];
const dirIndex = {
    "up": 0,
    "left": 1,
    "down": 2,
    "right": 3
};

let l = []; // level thresholds
for (let i = 0; i < 60; i++) l.push(Math.ceil(Math.pow((i + 2), 2.635)));

let leaderboard = [];
let allPlayers = [];
let timeSinceLbUpdate = Date.now() + 500;

class Body {
    /**
     * Generates a tank body
     */
    constructor({ hitboxIndex, speedMod = 1, healthMod = 1, scale = 1, fov = 1, timeToRegen = 20000 }) {
        this.hitbox = hitboxes[hitboxIndex];
        this.speedMod = speedMod;
        this.healthMod = healthMod;
        this.tankSize = scale;
        this.fov = fov;
        this.timeToRegen = timeToRegen;
    }
}

let tankBodies = [
    [ //* Tier 0
        //* Tank 0
        new Body({ hitboxIndex: 0 } ) //* Default - 0.0
    ],
    [ //* Tier 1
        //* Tank 0
        new Body({ hitboxIndex: 1, speedMod: 1.1 }), //* Serpent MK I - 1.0
        //* Tank 1
        new Body({ hitboxIndex: 0, healthMod: 1.1, fov: 1.2, timeToRegen: 17000 }), //* Squire MK I - 1.1
    ],
    [ //* Tier 2
        //* Tank 0
        new Body({ hitboxIndex: 1, speedMod: 1.1, healthMod: 0.7 }), //* Serpent MK II - 2.0
        //* Tank 1
        new Body({ hitboxIndex: 1, speedMod: 0.9, healthMod: 1.4, fov: 1.6, timeToRegen: 15000 }), //* Squire MK II - 2.1
    ],
    [ //* Tier 3
        //* Tank 0
        new Body({ hitboxIndex: 1, speedMod: 1.3, healthMod: 0.5 }), //* Basilisk - 3.0
        //* Tank 1
        new Body({ hitboxIndex: 1, speedMod: 0.8, healthMod: 2, fov: 2, timeToRegen: 10000 }), //* Knight - 3.1
    ]
];


class Turret {
    /**
     * Generates a turret object.
     */
    constructor({
        type, maxCD, dmg, offsetX = 0, offsetY = 0,
        offsetAngle = 0, bulletScale = 1, bulletSpeedMult = 1,
        lifespanMult = 1, shootingOffset = 0, turretScale = 1,
        bulletCount = 1, spread = 0
    }) {
        let l;
        switch (type) {

            // default
            case 0:
                l = 41.8;
                break;

            // shotgun
            case 1:
                l = 32.56;
                break;
            
            // sniper
            case 2:
                l = 51.04;
                break;

            // machine gun
            case 3:
                l = 32.56;
                break;

            // hunter
            case 4:
                l = 51.04;  
                break;
            
            // sprayer
            case 5:
                l = 41.8;
                break;

            // destroyer
            case 6:
                l = 45.76;
                break;

            // cannoneer
            case 7:
                l = 45.76;
                break;

            // bomber
            case 8:
                l = 45.76;
                break;

            default:
                console.log(`Error: turret ${type} does not have a length`);
                process.exit();
        }
        l *= turretScale;
        let sa = shootingOffset % maxCD
        let bulletYOffset = l - bulletScale;

        this.type = type;
        this.scale = turretScale;
        this.turretCD = sa;
        this.turretMaxCD = maxCD;
        this.length = l;
        this.distance = Math.sqrt(Math.pow(Math.abs(offsetX), 2) + Math.pow(Math.abs(offsetY + bulletYOffset), 2));
        this.turretAngle = Math.atan2(-offsetY - bulletYOffset, offsetX);
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.offsetAngle = offsetAngle;
        this.bulletDmg = dmg;
        this.bulletScale = bulletScale;
        this.bulletSpeedMult = bulletSpeedMult;
        this.lifespanMult = lifespanMult;
        this.shootingOffset = sa;
        this.bulletCount = bulletCount;
        this.spread = spread;
    }
}

const turrets = [
    [ // tier 0
        [new Turret({ type: 0, maxCD: 10, dmg: 5 })] // default
    ],
    [ // tier 1
        [new Turret({ type: 2, maxCD: 20, dmg: 10, bulletSpeedMult: 2, lifespanMult: 2 })], // sniper
        [new Turret({ type: 3, maxCD: 3, dmg: 2.5, bulletScale: 0.65, spread: Math.PI / 4 })], // machine gun
        [
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetX: -10 }), // twin
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetX: 10 })
        ]
    ],
    [ // tier 2
        [new Turret({ type: 4, maxCD: 15, dmg: 15, bulletSpeedMult: 2, lifespanMult: 2 })], // hunter
        [
            new Turret({ type: 5, maxCD: 2, dmg: 2.5, offsetY: 20, bulletScale: 0.65, spread: Math.PI / 4 }), // sprayer
            new Turret({ type: 5, maxCD: 2, dmg: 2.5, bulletScale: 0.65, spread: Math.PI / 4 })
        ],
        [new Turret({ type: 1, maxCD: 15, dmg: 1.5, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6, spread: Math.PI / 8, bulletCount: 6 })], // shotgun
        [
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetX: -10 }), // twinner (better twin)
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetX: 10 })
        ],
        [new Turret({ type: 6, maxCD: 40, dmg: 45, bulletScale: 1.2, bulletSpeedMult: 0.8, lifespanMult: 0.8 })] // destroyer
    ],
    [ // tier 3
        [new Turret({ type: 4, maxCD: 14, dmg: 20, bulletSpeedMult: 2, lifespanMult: 2 })], // predator
        [
            new Turret({ type: 1, maxCD: 15, dmg: 1.5, offsetX: -7, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6, spread: Math.PI / 8, bulletCount: 6 }), // Scatterer (twin shotgun)
            new Turret({ type: 1, maxCD: 15, dmg: 1.5, offsetX: 7, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6, spread: Math.PI / 8, bulletCount: 6 })
        ],
        [
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetX: -20 }), // triplet
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetX: 20 }),
            new Turret({ type: 0, maxCD: 10, dmg: 5, offsetY: 10 })
        ],
        [
            new Turret({ type: 0, maxCD: 10, dmg: 3, offsetX: -20, bulletSpeedMult: 0.7, bulletScale: 0.8 }), // gunner
            new Turret({ type: 0, maxCD: 10, dmg: 3, offsetX: -12, shootingOffset: 3, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
            new Turret({ type: 0, maxCD: 10, dmg: 3, offsetX: -4, shootingOffset: 7, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
            new Turret({ type: 0, maxCD: 10, dmg: 3, offsetX: 20, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
            new Turret({ type: 0, maxCD: 10, dmg: 3, offsetX: 12, shootingOffset: 3, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
            new Turret({ type: 0, maxCD: 10, dmg: 3, offsetX: 4, shootingOffset: 7, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
        ],
        [
            new Turret({ type: 5, maxCD: 2, dmg: 4, offsetY: 18, bulletScale: 0.65, spread: Math.PI / 4 }), // pelleteer
            new Turret({ type: 5, maxCD: 2, dmg: 4, bulletScale: 0.65, spread: Math.PI / 4 })
        ],
        [new Turret({ type: 7, maxCD: 35, dmg: 60, bulletScale: 1.3, bulletSpeedMult: 0.8, lifespanMult: 0.9 })] // cannoneer
    ],
    [ // tier 4
        [
            new Turret({ type: 2, maxCD: 10, dmg: 10, offsetX: -10, offsetAngle: -Math.PI / 100, bulletSpeedMult: 2, lifespanMult: 2 }), // Focused Sniper
            new Turret({ type: 2, maxCD: 10, dmg: 10, offsetX: 10, offsetAngle: Math.PI / 100, bulletSpeedMult: 2, lifespanMult: 2 }),
            new Turret({ type: 4, maxCD: 10, dmg: 10, bulletSpeedMult: 2, lifespanMult: 2 })
        ],
        [
            new Turret({ type: 1, maxCD: 10, dmg: 1.5, offsetX: -4, offsetAngle: -Math.PI / 10, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6, spread: Math.PI / 8, bulletCount: 6 }), // Scattershot (shotgun triplet)
            new Turret({ type: 1, maxCD: 10, dmg: 1.5, offsetX: 4, offsetAngle: Math.PI / 10, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6, spread: Math.PI / 8, bulletCount: 6 }),
            new Turret({ type: 1, maxCD: 10, dmg: 1.5, offsetY: 10, bulletScale: 0.6, bulletSpeedMult: 0.9, lifespanMult: 0.6, spread: Math.PI / 8, bulletCount: 6 })
        ],
        [
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetX: -20 }), // Trifecta (better triplet)
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetX: 20 }),
            new Turret({ type: 0, maxCD: 7, dmg: 7, offsetY: 10 })
        ],
        [
            new Turret({ type: 0, maxCD: 9, dmg: 5, offsetX: -20, bulletSpeedMult: 0.7, bulletScale: 0.8 }), // gatling gun (better gunner)
            new Turret({ type: 0, maxCD: 9, dmg: 5, offsetX: -12, shootingOffset: 3, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
            new Turret({ type: 0, maxCD: 9, dmg: 5, offsetX: -4, shootingOffset: 6, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
            new Turret({ type: 0, maxCD: 9, dmg: 5, offsetX: 20, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
            new Turret({ type: 0, maxCD: 9, dmg: 5, offsetX: 12, shootingOffset: 3, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
            new Turret({ type: 0, maxCD: 9, dmg: 5, offsetX: 4, shootingOffset: 6, bulletSpeedMult: 0.7, bulletScale: 0.8 }),
        ],
        [
            new Turret({ type: 5, maxCD: 2, dmg: 3, offsetY: 25, bulletScale: 0.65, spread: Math.PI / 4 }),
            new Turret({ type: 5, maxCD: 2, dmg: 3, offsetY: 15, bulletScale: 0.65, spread: Math.PI / 4 }), // railgun
            new Turret({ type: 5, maxCD: 2, dmg: 3, bulletScale: 0.65, spread: Math.PI / 4 })
        ],
        [new Turret({ type: 8, maxCD: 25, dmg: 100, bulletScale: 1.4, bulletSpeedMult: 0.8, lifespanMult: 1 })] // cannoneer
    ]
]

const turretTree = [
    [ // tier 0 upgrades
        [0, 1, 2] // default upgrades
    ],
    [ // tier 1 upgrades
        [0], // sniper upgrades
        [1, 2, 4], // machine gun upgrades
        [3] // twin upgrades
    ],
    [ // tier 2 upgrades
        [0], // hunter upgrades
        [4], // sprayer upgrades
        [1], // shotgun upgrades
        [1, 2, 3], // twinner upgrades
        [5] // destroyer upgrades
    ],
    [ // tier 3 upgrades
        [0], // predator upgrades
        [1], // scatterer upgrades
        [1, 2], // triplet upgrades
        [3], // gunner upgrades
        [4], // pelleteer upgrades
        [5] // cannoneer upgrades
    ],
    [ // tier 4 upgrades
        [],
        [],
        [],
        [],
        [],
        []
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
        obj.startXp = extra.startXp || 0;

        switch (obj.devID) {
            case "3CkhWrJQeR3svJHs8VXz": //! Alez
                obj.name = "> Alez - Developer <";
                obj.devMode = 69420;
                break;
            case "TUnSbTafPZgu7yfckH3m": //* Gark
                obj.name = "> Garklein - Developer <";
                obj.devMode = 69421;
                break;
            case "pSUsRQ2xEwWnCve5-Sam": // Sample
                //obj.name = "";
                obj.devMode = 1;
                break;
            case "pSUsRQ2xEwWnCve5-Shlaq": // Shlaq
                //obj.name = "";
                obj.devMode = 10002;
                break;
            case "pSUsRQ2xEwWnCve5-Pig": // Nation
                //obj.name = "";
                obj.devMode = 3;
                break;
        }


        //!TANK
        obj.health = 100;
        obj.maxHealth = 100;
        obj.tank = 0;
        obj.tier = 0;
        obj.hasBodyUpgrade = false;

        obj.tank === 0 ? obj.tier = 0 : null;
        obj.props = tankBodies[obj.tier][obj.tank];
        obj.fov = tankBodies[obj.tier][obj.tank].fov;

        //!SHOOTING
        obj.turretTier = 0;
        obj.turretIndex = 0;
        obj.turrets = [];
        obj.availableTurrets = [[], []];
        obj.obtainedTurrets = [];
        obj.hasTurretUpgrade = false;
        obj.turrets = v8.deserialize(v8.serialize(turrets[obj.turretTier][obj.turretIndex]));
        obj.obtainedTurrets.push(turrets[obj.turretTier][obj.turretIndex]);

        //!MOVEMENT
        obj.direction = 0;
        obj.playerInput = new game.playerInput();
        obj.dirArray = [];
        obj.dirString = "falsefalsefalsefalse";
        // obj.dance = extra.dance;
        obj.dance = false;

        //!LEVELS
        obj.xp = 0 + obj.startXp;
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
        obj.zoom = true;

        obj.handleHitbox = () => {
            obj.props = tankBodies[obj.tier][obj.tank];
            obj.body.shapes[0] = new game.rectangle(obj.props.hitbox.h * DEFAULT_SCALE * obj.props.tankSize, obj.props.hitbox.w * DEFAULT_SCALE * obj.props.tankSize);
        }

        obj.updateTurrets = () => {
            obj.turrets = [];
            obj.turrets = v8.deserialize(v8.serialize(turrets[obj.turretTier][obj.turretIndex]));
        }

        obj.upgradeBody = data => {
            let tier = data.tier;
            let tank = data.tank;
            if (tier === 0) return;
            if (tier - obj.tier > 1) return;
            if (obj.tier !== 0) if (obj.tank !== tank) return;
            if (obj.level < (tier * 10 + (tier - 1) * 10)) return;
            if (tier <= obj.tier) return;
            obj.tier = tier;
            obj.tank = tank;
            obj.fov = tankBodies[tier][tank].fov;
            obj.handleHitbox();
            obj.sendPacket({ type: "f", fov: obj.fov });
        }

        obj.getAvailableTurrets = () => {
            let turretsArray = [[], []];
            let availableTurretIndexes = turretTree[obj.turretTier][obj.turretIndex];
            if (availableTurretIndexes !== []) {
                availableTurretIndexes.forEach(turreti => {
                    turretsArray[0].push([obj.turretTier + 1, turreti]);
                    turretsArray[1].push(turrets[obj.turretTier + 1][turreti]);
                });
            }

            return turretsArray;
        }

        obj.upgradeTurret = data => {
            let tier = data.tier;
            let turreti = data.turreti;
            //if (tier - obj.tier > 1) return;
            //if (obj.tank !== 0) if (obj.tank !== tank) return;
            if (obj.level < tier * 10) return;
            //if (tier <= obj.turretTier) return;
            obj.availableTurrets = obj.getAvailableTurrets();
            if (!obj.availableTurrets[1].includes(turrets[tier][turreti])) return;

            obj.obtainedTurrets.push(turrets[tier][turreti]);
            obj.turretTier = tier;
            obj.turretIndex = turreti;
            obj.updateTurrets();
            obj.availableTurrets = obj.getAvailableTurrets();
            obj.sendPacket({ type: "tt", turrets: obj.availableTurrets });
        }
    },
    // Tick Update
    function (obj, lb) {
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

        obj.hasBodyUpgrade = (obj.level >= ((obj.tier + 1) * 10 + (obj.tier) * 10)) ? true : false;
        obj.hasTurretUpgrade = (obj.level >= ((obj.turretTier + 1) * 10)) ? true : false;

        obj.availableTurrets = obj.getAvailableTurrets();

        if (Date.now() > obj.regen) obj.health = Math.min(obj.health + 0.3, obj.maxHealth);

        obj.body.angle = obj.direction * (Math.PI / 180);
        handleMovement(obj);

        let s = false;

        obj.turrets.forEach(turret => {
            if (turret.turretCD !== turret.shootingOffset) {
                if ((turret.turretCD / 0.5) % 2) turret.turretCD += 0.5;
                turret.turretCD--;
            }
            if (turret.shootingOffset && !turret.turretCD) s = true;
        });
        if (obj.playerMouse.clicking) s = true;
        if (s) shoot(obj);

        if (lb === 1) allPlayers.push({ name: obj.name, xp: obj.xp });
        else if (lb === 2) {
            if (Date.now() > timeSinceLbUpdate) {
                leaderboard = allPlayers.sort((a, b) => {
                    return b.xp - a.xp;
                });
                if (leaderboard.length > 5) leaderboard.splice(5, leaderboard.length - 5)
                allPlayers = [];
                timeSinceLbUpdate = Date.now() + 500;
            }
        }
    },
    // Packet Update
    function (obj, packet) {
        packet.health = obj.health;
        packet.tank = obj.tank;
        packet.tier = obj.tier;
        packet.angle = obj.playerMouse.angle;

        packet.hasBodyUpgrade = obj.hasBodyUpgrade;
        packet.hasTurretUpgrade = obj.hasTurretUpgrade;
        packet.availableTurrets = obj.availableTurrets;

        packet.xp = obj.xp;
        packet.level = obj.level;
        packet.lvlPercent = obj.level === 60 ? 1 : ((obj.xp - (l[obj.level - 1] || 0)) / ((l[obj.level] - l[obj.level - 1]) || l[0]));

        packet.turrets = obj.turrets;

        packet.lb = leaderboard;
    },
    // Add
    function (obj, packet) {
        packet.health = obj.health;
        packet.maxHealth = obj.maxHealth;
        packet.tank = obj.tank;
        packet.tier = obj.tier;

        packet.hasBodyUpgrade = obj.hasBodyUpgrade;
        packet.hasTurretUpgrade = obj.hasTurretUpgrade;
        packet.availableTurrets = obj.availableTurrets;
        setTimeout(() => obj.sendPacket({ type: "tt", turrets: obj.availableTurrets }), 2000);

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

            indexesToSplice.forEach((d, i) => obj.dirArray.splice(d - i, 1));
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

const shoot = obj => {
    obj.turrets.forEach(turret => {
        if (turret.shootingOffset && (turret.turretCD === turret.shootingOffset)) turret.turretCD -= 0.5;
        if (turret.turretCD !== 0) return;
        let bulletAngle = obj.playerMouse.angle + turret.offsetAngle;
        let finalPosition = {
            x: Math.sin(2 * Math.PI - obj.playerMouse.angle + turret.turretAngle) * turret.distance,
            y: Math.cos(2 * Math.PI - obj.playerMouse.angle + turret.turretAngle) * turret.distance
        }
        for (let i = 0; i < turret.bulletCount; i++) {
            let ba = bulletAngle + Math.random() * turret.spread - turret.spread / 2;
            game.create("bullet", {
                type: turret.type,
                pos: [
                    obj.body.position[0] + finalPosition.x, 
                    obj.body.position[1] + finalPosition.y
                ],
                angle: ba,
                velocity: obj.body.velocity,
                ownerID: obj.id,
                damage: turret.bulletDmg,
                scale: turret.bulletScale * turret.scale,
                bulletSpeedMult: turret.bulletSpeedMult,
                lifespanMult: turret.lifespanMult
            });
        }
        turret.turretCD = turret.turretMaxCD;
    });
}