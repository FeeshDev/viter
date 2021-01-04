game.addType(
    // Type
    "wall",
    // Create
    function (obj, extra) {
        //console.log(extra);
        obj.body = new game.body(0);
        obj.body.type = 0;
        obj.body.position = [extra.x, extra.y];
        obj.body.addShape(new game.rectangle(extra.w, extra.h));
        obj.body.fixedX = true;
        obj.body.fixedY = true;
        obj.body.fixedRotoation = true;
        obj.needsUpdate = false;
    },
    // Tick Update
    function (obj) {
    },
    // Packet Update
    function (obj, packet) {
    },
    // Add
    function (obj, packet) {
        packet.w = obj.body.shapes[0].width;
        packet.h = obj.body.shapes[0].height;
        packet.x = obj.body.position[0];
        packet.y = obj.body.position[1];
    }
);