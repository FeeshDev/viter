//* MAP CONFIG
const MAP_SIZE = 4000;
const WALL_SIZE = 100;

const TREE_COUNT = 60;
const ROCK_COUNT = 30;

game.create("wall", { x: MAP_SIZE / 2, y: -WALL_SIZE / 2, w: MAP_SIZE + WALL_SIZE * 2, h: WALL_SIZE });
game.create("wall", { x: MAP_SIZE / 2, y: MAP_SIZE + WALL_SIZE / 2, w: MAP_SIZE + WALL_SIZE * 2, h: WALL_SIZE });
game.create("wall", { x: -WALL_SIZE / 2, y: MAP_SIZE / 2, w: WALL_SIZE, h: MAP_SIZE + WALL_SIZE * 2 });
game.create("wall", { x: MAP_SIZE + WALL_SIZE / 2, y: MAP_SIZE / 2, w: WALL_SIZE, h: MAP_SIZE + WALL_SIZE * 2 });

const TYPE_TREE = 0, TYPE_ROCK = 1;

//*Spawnables
for (let i = 0; i < TREE_COUNT; i++) {
    game.create("object", [TYPE_TREE]);
}

for (let i = 0; i < ROCK_COUNT; i++) {
    game.create("object", [TYPE_ROCK]);
}

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