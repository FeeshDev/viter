the old readme before the new docs, just some notes


# viter
 
# Adding turret images
* add the image in client/images/cannons
* in server/server/player.js in the Turret class constructor, add another case in the switch where l gets put equal to turretHeight (in pixels) / (500 / 220) (note that the program will exit if you don't have this, to prevent NaN bullets and stuff)
* In client/js/client.js, add them in the bullet const (BULLET_XXX = n)
* In client/js/client.js, add the src for the bullet type
* Inin client/js/gameio.js, add the type const in (TURRET_XXX = n) and add its image in the turretSwitch function
* Add custom bullet features if there are any (for stuff on collisions you probably want server/server/bullet.js, for stuff like spread use the switch in the shoot function in server/server/player.js)