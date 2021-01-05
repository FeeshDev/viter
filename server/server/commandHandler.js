global.executeCommand = (userSelf, command, accessCode) => {
    let commandArray = command.split(':');
    console.log(`Command "${command}" requested.`)
    switch (commandArray[0]) {
        case "tank":
            try {
                userSelf.tank = parseInt(commandArray[1]) || 0;
                userSelf.handleHitbox();
            } catch (e) {
                console.log(e);
            }
            break;
        case "tier":
            try {
                userSelf.tier = parseInt(commandArray[1]) || 0;
                userSelf.handleHitbox();
            } catch (e) {
                console.log(e);
            }
            break;
        case "tt":
            try {
                userSelf.tank = parseInt(commandArray[1]) || 0;
                userSelf.tier = parseInt(commandArray[2]) || 0;
                userSelf.handleHitbox();
            } catch (e) {
                console.log(e);
            }
            break;
        case "turreti":
            try {
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
                userSelf.health = parseInt(commandArray[1]) || 100;
            } catch (e) {
                console.log(e);
            }
            break;
        case "setmaxhp":
            try {
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
            console.log(`Command "${commandArray[0]}" not found.`)
    }
}