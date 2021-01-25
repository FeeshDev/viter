global.executeCommand = (userSelf, command, accessCode) => {
    if (!userSelf) return;
    if (!userSelf.devMode) return;
    let commandArray = command.split(':');
    console.log(`"${userSelf.name}" requested command: "${command}".`);
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
        case "turreti":
            try {
                let turretIndex = Math.round(parseInt(commandArray[1], 10));
                if (turretIndex === NaN || turretIndex < 0 || turretIndex > 8) return;
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
        default:
            console.log(`"${userSelf.name}" requested command: "${command}" which could not be found.`);
    }
}