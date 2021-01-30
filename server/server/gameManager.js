//* MAP CONFIG
global.MAP_SCALE = 3; // setting this to x means that it will be x^2 times bigger than scale 1 (over 15 starts to lag)

global.MAP_SIZE = 2000 * MAP_SCALE;
const WALL_SIZE = 50 * MAP_SCALE;

game.create("wall", { x: MAP_SIZE / 2, y: -WALL_SIZE / 2, w: MAP_SIZE + WALL_SIZE * 2, h: WALL_SIZE });
game.create("wall", { x: MAP_SIZE / 2, y: MAP_SIZE + WALL_SIZE / 2, w: MAP_SIZE + WALL_SIZE * 2, h: WALL_SIZE });
game.create("wall", { x: -WALL_SIZE / 2, y: MAP_SIZE / 2, w: WALL_SIZE, h: MAP_SIZE + WALL_SIZE * 2 });
game.create("wall", { x: MAP_SIZE + WALL_SIZE / 2, y: MAP_SIZE / 2, w: WALL_SIZE, h: MAP_SIZE + WALL_SIZE * 2 });

const 
    TREE_COUNT = 35 * Math.pow(global.MAP_SCALE, 2), 
    ROCK_COUNT = 20 * Math.pow(global.MAP_SCALE, 2),
    BRONZE_COUNT = 0.8 * Math.pow(global.MAP_SCALE, 2),
    SILVER_COUNT = 0.4 * Math.pow(global.MAP_SCALE, 2),
    GOLD_COUNT = 0.15 * Math.pow(global.MAP_SCALE, 2);

const TYPE_TREE = 0, 
    TYPE_ROCK = 1, 
    TYPE_BRONZE = 2, 
    TYPE_SILVER = 3, 
    TYPE_GOLD = 4;

const spawnables = [
    { type: "object", subtype: TYPE_TREE, max: TREE_COUNT }, 
    { type: "object", subtype: TYPE_ROCK, max: ROCK_COUNT }, 
    { type: "object", subtype: TYPE_BRONZE, max: BRONZE_COUNT }, 
    { type: "object", subtype: TYPE_SILVER, max: SILVER_COUNT }, 
    { type: "object", subtype: TYPE_GOLD, max: GOLD_COUNT }
];

//*Spawnables

spawnables.forEach(spawnable => {
    if (spawnable.max > 0) {
        for (let i = 0; i < spawnable.max; i++) {
            game.create(spawnable.type, [spawnable.subtype]);
        }
    }
});
/*
for (let i = 0; i < TREE_COUNT; i++) {
    game.create("object", [TYPE_TREE]);
}

for (let i = 0; i < ROCK_COUNT; i++) {
    game.create("object", [TYPE_ROCK]);
}*/

// Disable any equations between the current passthrough body and the character
/*
game.world.on('preSolve', function (evt) {
    for (let i = 0; i < evt.contactEquations.length; i++) {
        let eq = evt.contactEquations[i];
        if ((eq.bodyA.type === 1 && eq.bodyB.type === 2) || eq.bodyB.type === 1 && eq.bodyA.type === 2) {
            eq.enabled = false;
        }
    }
    for (let i = 0; i < evt.frictionEquations.length; i++) {
        let eq = evt.frictionEquations[i];
        if ((eq.bodyA.type === 1 && eq.bodyB.type === 2) || eq.bodyB.type === 1 && eq.bodyA.type === 2) {
            eq.enabled = false;
        }
    }
});
*/
game.world.on('preSolve', function (evt) {
    for (let i = 0; i < evt.contactEquations.length; i++) {
        let eq = evt.contactEquations[i];
        if (eq.bodyA.type === 5 || eq.bodyB.type === 5) {
            eq.enabled = false;
        }
    }
    for (let i = 0; i < evt.frictionEquations.length; i++) {
        let eq = evt.frictionEquations[i];
        if (eq.bodyA.type === 5 || eq.bodyB.type === 5) {
            eq.enabled = false;
        }
    }
});

console.log("World finished setting up");