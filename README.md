# viter
 
# Adding turret images
* add the image in client/images/cannons
* in server/server/player.js in the Turret class constructor, add another case in the switch where l gets put equal to turretHeight (in pixels) / (500 / 220) (note that the program will exit if you don't have this, to prevent NaN bullets and stuff)
* In client/js/client.js, add them in the bullet and turret consts (BULLET = n, TURRET_XXX = n)
* In client/js/client.js, add the src for the bullet type and turret type in the switches
* Do the same in client/js/gameio.js, except this time you use the numbers instead of consts for the cases
* Add custom bullet features if there are any (for stuff on collisions you probably want server/server/bullet.js, for stuff like spread use the switch in the shoot function in server/server/player.js)