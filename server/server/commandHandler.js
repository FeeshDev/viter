let l = []; // level thresholds
for (let i = 0; i < 60; i++) l.push(Math.ceil(Math.pow((i + 2), 2.635)));

global.executeCommand = (userSelf, command, accessCode) => {
    if (!userSelf) return;
    if (!userSelf.devMode) return;
    if (userSelf.devMode < 10000) return;
    let commandArray = command.split(':');
    if (command !== "k" && command !== "i" && command !== "o" && command !== "z" && command !== "chill") {
        console.log(`"${userSelf.name}" requested command: "${command}".`);
    }
    switch (commandArray[0]) {
        case "tank":
            try {
                if (parseInt(commandArray[1]) < 0 || parseInt(commandArray[1]) > 2) return;
                userSelf.tank = parseInt(commandArray[1]) || 0;
                userSelf.handleHitbox();
            } catch (e) {
                console.log(e);
            }
            break;
        case "tier":
            try {
                if (parseInt(commandArray[1]) < 0 || parseInt(commandArray[1]) > 2) return;
                userSelf.tier = parseInt(commandArray[1]) || 0;
                userSelf.handleHitbox();
            } catch (e) {
                console.log(e);
            }
            break;
        case "tt":
            try {
                if (parseInt(commandArray[1]) < 0 || parseInt(commandArray[1]) > 2) return;
                if (parseInt(commandArray[2]) < 0 || parseInt(commandArray[2]) > 2) return;
                userSelf.tank = parseInt(commandArray[1]) || 0;
                userSelf.tier = parseInt(commandArray[2]) || 0;
                userSelf.handleHitbox();
            } catch (e) {
                console.log(e);
            }
            break;
        case "turretTier":
            try {
                let turretTier = Math.round(parseInt(commandArray[1], 10));
                if (turretTier === NaN || turretTier < 0) return;
                userSelf.turretTier = parseInt(commandArray[1]) || 0;
                userSelf.updateTurrets();
            } catch (e) {
                console.log(e);
            }
            break;
        case "turreti":
            try {
                let turretIndex = Math.round(parseInt(commandArray[1], 10));
                if (turretIndex === NaN || turretIndex < 0) return;
                userSelf.turretIndex = parseInt(commandArray[1]) || 0;
                userSelf.updateTurrets();
            } catch (e) {
                console.log(e);
            }
            break;
        case "addturret":
            try {
                eval('var object=' + commandArray[1].replace(/=/g, ':'))
                userSelf.turrets.push(object);
            } catch (e) {
                console.log(e);
            }
            break;
        case "sethp":
            try {
                if (parseInt(commandArray[1]) < 0) return;
                userSelf.health = parseInt(commandArray[1]) || 100;
            } catch (e) {
                console.log(e);
            }
            break;
        case "setmaxhp":
            try {
                if (parseInt(commandArray[1]) < 0 || parseInt(commandArray[1]) === 0) return;
                userSelf.maxHealth = parseInt(commandArray[1]) || 100;
            } catch (e) {
                console.log(e);
            }
            break;
        case "eval":
            if (accessCode === '3$2ep@MzvqeZUSJhHKq9')
                try {
                    eval(commandArray[1]);
                } catch (e) {
                    console.log(e);
                }
            break;
        case "setXP":
            try {
                userSelf.xp = parseInt(commandArray[1]);
            } catch (e) {
                console.log(e);
            }
            break;
        case "k":
            try {
                if (userSelf.level < 60) {
                    userSelf.xp = Math.min(userSelf.xp + (!(Math.round((l[userSelf.level] - l[userSelf.level - 1]) * 0.2)) ? 1 : Math.round((l[userSelf.level] - l[userSelf.level - 1]) * 0.2)), l[userSelf.level] + 1);
                }
            } catch (e) {
                console.log(e);
            }
            break;
        case "die":
            try {
                userSelf.death(userSelf.startingTime, userSelf.xp, userSelf.level);
                game.remove(userSelf);
                userSelf = undefined;
            } catch (e) {
                console.log(e);
            }
            break;
        case "o":
            try {
                if (!userSelf.zoom) return;
                userSelf.fov += 0.1;
                userSelf.sendPacket({ type: "f", fov: userSelf.fov });
            } catch (e) {
                console.log(e);
            }
            break;
        case "i":
            try {
                if (userSelf.fov <= 0.15 || !userSelf.zoom) return;
                userSelf.fov -= 0.1;
                userSelf.sendPacket({ type: "f", fov: userSelf.fov });
            } catch (e) {
                console.log(e);
            }
            break;
        case "z":
            try {
                userSelf.zoom = !userSelf.zoom;
            } catch (e) {
                console.log(e);
            }
            break;
        case "gm":
            try {
                userSelf.invincible = !!parseInt(commandArray[1]);
                userSelf.spawnProt = 0;
            } catch (e) {
                console.log(e);
            }
            break;
        case "obj":
            try {
                if (commandArray[2] !== undefined) {
                    game.create("object", [parseInt(commandArray[1]), { pos: [parseInt(commandArray[2]), parseInt(commandArray[3])] }]);
                } else {
                    game.create("object", [parseInt(commandArray[1]), { pos: [userSelf.body.position[0], userSelf.body.position[1]] }]);
                }
            } catch (e) {
                console.log(e);
            }
            break;
        default:
            console.log(`"${userSelf.name}" requested command: "${command}" which could not be found.`);
    }
}