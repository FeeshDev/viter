let objects = [
    { //* Tree
        size: 22,
        health: 80,
        respawn: true,
        scale: () => { return getRandomInt(10, 20) / 10 },
        shape: 'circle',
        damping: 0,
        subTypes: [0, 1],
        bodyType: 2,
        global: false
    },
    { //* Rock
        size: 22,
        health: 200,
        respawn: true,
        scale: () => { return getRandomInt(10, 15) / 10 },
        shape: 'circle',
        damping: 0,
        bodyType: 3,
        global: false
    },
    { //* Bronze Crate
        size: 30,
        health: 250,
        respawn: true,
        scale: () => { return getRandomInt(20, 35) / 10 },
        shape: "rectangle",
        damping: 0,
        bodyType: 4,
        global: false
    },
    { //* Silver Crate
        size: 30,
        health: 300,
        respawn: true,
        scale: () => { return getRandomInt(25, 30) / 10 },
        shape: "rectangle",
        damping: 0,
        bodyType: 4,
        global: false
    },
    { //* Gold Crate
        size: 30,
        health: 400,
        respawn: true,
        scale: () => { return getRandomInt(20, 25) / 10 },
        shape: "rectangle",
        damping: 0,
        bodyType: 4,
        global: false
    }
]
game.addType(
    // Type
    "object",
    // Create
    function (obj, extra) {
        obj.objType = extra[0];
        let extras = extra[1];
        obj.props = objects[obj.objType];

        obj.health = obj.props.health ? obj.props.health : 100;
        obj.maxHealth = obj.props.health ? obj.props.health : 100;

        obj.body = new game.body(0);
        obj.body.type = obj.props.bodyType;
        extras ? obj.body.position = extras.pos : obj.body.position = [getRandomInt(0, MAP_SIZE), getRandomInt(0, MAP_SIZE)];
        obj.body.angle = Math.random() * 2 * Math.PI;
        obj.ttfloat = Math.random() * 24 + 24;
        obj.scale = obj.props.scale();
        obj.props.subTypes ? obj.subObjType = getRandomInt(obj.props.subTypes[0], obj.props.subTypes[1]) : null;
        switch (obj.props.shape) {
            case "circle":
                obj.body.addShape(new game.circle(obj.props.size * obj.scale));
                break;
            case "rectangle":
                obj.body.addShape(new game.rectangle(obj.props.size * obj.scale, obj.props.size * obj.scale));
                break;
        }
        obj.body.damping = obj.props.damping;

        obj.needsUpdate = true;

        //! GLOBAL DISPLAY CODE
        if (obj.props.global) {
            game.globalCoordPackets.push({ t: "g", i: obj.id, pos: { x: obj.body.position[0], y: obj.body.position[1] } });
            game.broadcast({ t: "g", i: obj.id, pos: { x: obj.body.position[0], y: obj.body.position[1] } });
        }
    },
    // Tick Update
    function (obj) {
        if (obj.health <= 0) {
            //! GLOBAL DISPLAY CODE
            if (obj.props.global) {
                for (let i = 0; i < game.globalCoordPackets.length; i++) {
                    let element = game.globalCoordPackets[i];
                    if (element.i === obj.id) game.globalCoordPackets.splice(i, 1);
                }
                game.broadcast({ t: "h", i: obj.id });
            }

            obj.props.respawn ? game.create("object", [obj.objType]) : null;
            game.remove(obj);
        };
    },
    // Packet Update
    function (obj, packet) {
        packet.health = obj.health;
    },
    // Add
    function (obj, packet) {
        packet.maxHealth = obj.maxHealth;
        packet.health = obj.health;
        packet.objType = obj.objType;
        if (obj.subObjType > -1) packet.subObjType = obj.subObjType;
        packet.scale = obj.scale;
    }
);