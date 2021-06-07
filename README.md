# viter.io docs

viter.io is an abandonned .io game, created by Alez and Garklein.
We have decided to make all the code public, because we think that others might find it interesting (there aren't many public code .io games).  
viter.io is made with:  
* ![node.js](https://nodejs.org/)
* ![Game.IO](https://github.com/GoalieSave25/GameIO)
* ![Express](https://expressjs.com/)
* ![msgpack-lite](https://www.npmjs.com/package/msgpack-lite)  
and various other minor libraries.

## how to run
make sure you have the latest version of node.js installed first (see link above)
1. clone the repository
2. cd to the folder root
3. cd server
4. run `node app`
5. the game is now running on http://localhost:80
6. this brings you to index2.html
7. to try the game, go to http://localhost:80/play

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
Used for encoding ws messages.


#### ![client/images](/client/images)
All game images. I won't be going in depth since the folders are self explanatory.

#### ![client/js](/client/js)
All client JavaScript files. They are all combined into one file on the ![server](/server/app.js).

![client/js/client.js](/client/js/client.js)
JavaScript file written by us. gameio.js setup, and main loop. Handles Also handles one random packet type (setID), for some reason.

![client/js/gameio.js](/client/js/gameio.js)
File initially taken from the gameio library. Handles game rendering, user input, game state array (all players/objects/etc you can see), and most client packet handling.


### NB
You can do a lot of funky stuff by sending invalid packets. There should be better checking there, but we never got around to it.
