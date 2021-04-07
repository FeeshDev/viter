# viter.io docs

## files

### ![server](/server)
These are all the files for the server.

![server/app.js](/server/app.js)
Server hosting and packet handling.

![server/gameio.js](/server/gameio.js)
More specific connection handling, and handling of all arrays (this is from the game.io library).

![server/node_modules](/server/node_modules)
Automatically generated node modules from node.js.


#### ![server/server](/server/server)
The meat of the server logic.

![server/server/bullet.js](/server/server/bullet.js)
Bullet logic.

![server/server/commandHandler.js](/server/server/commandHandler.js)
Logic for dev commands.

![server/server/gameManager.js](/server/server/gameManager.js)
Spawning objects and setting up the world.

![server/server/object.js](/server/server/object.js)
Trees, rocks, and crates.

![server/server/player.js](/server/server/player.js)
Shooting, movement, and everything to do with players. Also arrays of all turrets and bodies.

![server/server/wall.js](/server/server/wall.js)
Walls.



### ![client](/client)
These are all the files for the server.

![client/index.html](/client/index.html)
The game HTML page.

![client/index2.html](/client/index2.html)
The placeholder HTML page, for when it was only in private testing.

![client/changelog.html](/client/changelog.html)
The changelog HTML page.

![client/main.css](/client/main.css)
The ![index.html](/client/index.html) css file.

![client/msgpack.js](/client/msgpack.js)
idk


#### ![client/images](/client/images)
All game images. I won't be going in depth since the folders are self explanatory.

#### ![client/js](/client/js)
All client JavaScript files. They are all combined into one file on the ![server](/server/app.js).

![client/js/client.js](/client/js/client.js)
JavaScript file written by us. gameio.js setup, and main loop. Handles Also handles one random packet type (setID), for some reason.

![client/js/gameio.js](/client/js/gameio.js)
File initially taken from the gameio library. Handles game rendering, user input, game state array (all players/objects/etc you can see), and most client packet handling.
