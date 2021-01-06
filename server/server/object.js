let objects = [
    { //* Tree
        size: 22,
        health: 80,
        scale: () => { return getRandomInt(10, 20) / 10 },
        shape: 'circle',
        damping: 0,
        subTypes: [0, 1],
        bodyType: 2,
    },
    { //* Rock
        size: 22,
        health: 200,
        scale: () => { return getRandomInt(10, 15) / 10 },
        shape: 'circle',
        damping: 0,
        bodyType: 3,
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
        extras ? obj.body.position = extras.pos : obj.body.position = [getRandomInt(1, 3999), getRandomInt(1, 3999)];
        obj.body.angle = Math.random() * 2 * Math.PI;
        obj.ttfloat = Math.random() * 24 + 24;
        obj.scale = obj.props.scale();
        obj.props.subTypes ? obj.subObjType = getRandomInt(obj.props.subTypes[0], obj.props.subTypes[1]) : null;
        obj.body.addShape(new game[obj.props.shape](obj.props.size * obj.scale));
        obj.body.damping = obj.props.damping;

        obj.needsUpdate = true;

        /* //! GLOBAL DISPLAY CODE
        if (obj.objType === 0) if (obj.subObjType === 1) game.globalCoords.push({ t: "g", i: obj.id, pos: { x: obj.body.position[0], y: obj.body.position[1] } });
        if (obj.objType === 0) if (obj.subObjType === 1) game.broadcast({ t: "g", i: obj.id, pos: { x: obj.body.position[0], y: obj.body.position[1] } });
        */
    },
    // Tick Update
    function (obj) {
        if (obj.health <= 0) {
            /* //! GLOBAL DISPLAY CODE
            for (let i = 0; i < game.globalCoords.length; i++) {
                let element = game.globalCoords[i];
                if (element.i === obj.id) game.globalCoords.splice(i, 1);
            }

            if (obj.objType === 0) if (obj.subObjType === 1) game.broadcast({ t: "h", i: obj.id });
            */
            game.remove(obj)
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