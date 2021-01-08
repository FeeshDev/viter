CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
}

let themes = [
  {
    edgeColor: '#069950',
    backgroundColor: '#17A456',
    minimapColor1: '#1D5737',
    minimapColor2: '#124D28'
  },
  {
    edgeColor: '#e0e0e0',
    backgroundColor: '#ebebeb',
    minimapColor1: '#adadad',
    minimapColor2: '#c4c4c4'
  },
  {
    edgeColor: '#0fa10c',
    backgroundColor: '#10af0d',
    minimapColor1: '#064005',
    minimapColor2: '#095907'
  }
];

var fps = { startTime: 0, frameNumber: 0, getFPS: function () { this.frameNumber++; var d = new Date().getTime(), currentTime = (d - this.startTime) / 1000, result = Math.floor((this.frameNumber / currentTime)); if (currentTime > 1) { this.startTime = new Date().getTime(); this.frameNumber = 0; } return result; } };
function gameIO() {
  // Rendering Portion
  var game = {
    renderers: [],
    scenes: [],
    particles: [],
    envs: {}
  };
  game.gamepad = function () {
    var gamepads = [];
    if (navigator.getGamepads !== undefined)
      gamepads = navigator.getGamepads();
    for (var i = 0; i < gamepads.length; i++) {
      if (gamepads[i] !== undefined)
        return gamepads[i];
    }
    return null;
  }
  game.gamepadControl = function () {
    var gamepad = {
      buttons: [],
      axes: []
    };
    for (var i = 0; i < 16; i++)
      gamepad.buttons.push({
        pressed: false
      });
    return gamepad;
  }
  game.mouse = function (renderer) {
    var mouse = new game.Vector2(0, 0);
    mouse.renderer = renderer || undefined;
    mouse.clicking = false;
    mouse.rightClicking = false;
    mouse.changed = false;
    mouse.rightChanged = true;
    mouse.moved = false;
    mouse.locked = false;
    mouse.client = new game.Vector2(0, 0);
    window.addEventListener("mousemove", function (event) {
      if (mouse.locked) {
        mouse.client.x += event.movementX;
        mouse.client.y += event.movementY;
        mouse.client.x = Math.max(Math.min(mouse.client.x, window.innerWidth), 0);
        mouse.client.y = Math.max(Math.min(mouse.client.y, window.innerHeight), 0);
        mouse.x = mouse.client.x;
        mouse.y = mouse.client.y;
      } else {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        mouse.client.x = mouse.x;
        mouse.client.y = mouse.y;
      }
      mouse.angle = Math.atan2(mouse.client.y - window.innerHeight / 2, mouse.client.x - window.innerWidth / 2);
      mouse.angle += Math.PI;
      mouse.moved = true;
    });
    window.addEventListener("mousedown", function (event) {
      if (event.button === 0) {
        mouse.clicking = true;
        mouse.changed = true;
      }
      else if (event.button == 2) {
        mouse.rightClicking = true
        mouse.rightChanged = true;
      }
      else if (event.button > 2) {
        event.preventDefault();
      }
    });
    window.addEventListener("click", function (event) {
      if (event.button > 2) {
        event.preventDefault();
      }
    });
    window.addEventListener("contextmenu", function (event) {
      event.preventDefault();
      if (event.stopPropagation != undefined)
        event.stopPropagation();
    });
    window.addEventListener("mouseup", function (event) {
      if (event.button === 0) {
        mouse.clicking = false;
        mouse.changed = true;
      }
      else if (event.button == 2) {
        mouse.rightClicking = false;
        mouse.rightChanged = true;
      }
      else if (event.button > 2) {
        // This one works
        event.preventDefault();
      }
    });
    mouse.fromRenderer = function (renderer) {
      this.x = (this.x - renderer.c.width / 2 - renderer.left) * renderer.ratio / 2;
      this.y = (this.y - renderer.c.height / 2 - renderer.top) * renderer.ratio / 2;
    }
    mouse.isCollidingWithRectangle = function (rectangle) {
      if (renderer === undefined)
        return false;
      if (this.x < rectangle.position.x + rectangle.width / 2 &&
        this.x > rectangle.position.x - rectangle.width / 2 &&
        this.y < rectangle.position.y + rectangle.height / 2 &&
        this.y > rectangle.position.y - rectangle.height / 2)
        return true;
      return false;
    }
    return mouse;
  };
  game.touch = function () {
    var touches = [];
    window.addEventListener("touchmove", function (event) {
      event.preventDefault();
      while (event.targetTouches.length > touches.length)
        touches.push(new game.Vector2(0, 0));
      while (event.targetTouches.length < touches.length)
        touches.splice(0, 1);
      for (var i = 0; i < event.targetTouches.length; i++) {
        touches[i].x = event.targetTouches[i].pageX;
        touches[i].y = event.targetTouches[i].pageY;
      }
    });
    window.addEventListener("touchend", function (event) {
      while (event.targetTouches.length < touches.length)
        touches.splice(0, 1);
    });
    window.addEventListener("touchstart", function (event) {
      event.preventDefault();
      for (var i = 0; i < event.targetTouches.length; i++) {
        if ((event.targetTouches[i].pageX - game.renderers[0].c.width / 2 - game.renderers[0].left) * game.renderers[0].ratio / 2 > 0) {
          controls.key_w = true;
        }
      }
    });
    return touches;
  }
  game.renderer = function (canvas) {
    if (canvas === undefined) {
      canvas = document.getElementById('canvas');
      canvas.style.position = "absolute";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.overflow = "hidden";
    }
    game.renderers.push({
      ctx: canvas.getContext('2d'),
      c: canvas,
      clearScreen: true,
      top: 0,
      left: 0,
      theme: 0,
      leftOfScreen: 0,
      rightOfScreen: 0,
      topOfScreen: 0,
      bottomOfScreen: 0,
      position: new game.Vector2(0, 0),
      ratio: 1,
      qualitySize: 1,
      smoothingEnabled: true,
      render: function (scene) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (this.clearScreen)
          this.clear();
        this.ctx.translate(-this.position.x / this.ratio + this.c.width / 2, -this.position.y / this.ratio + this.c.height / 2);
        scene.render(this.ctx, this.ratio * scene.camera.ratio, 1); //! scene render called here
      },
      clear: function () {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.c.width, this.c.height);
      },
      drawEdge: function () {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = themes[this.theme].edgeColor;
        this.ctx.globalAlpha = 1;
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);
      },
      drawBackground: function () {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = themes[this.theme].backgroundColor;
        this.ctx.globalAlpha = 1;
        this.ctx.fillRect(this.c.width / 2 - game.me.visual.position.x / this.ratio, this.c.height / 2 - game.me.visual.position.y / this.ratio, 4000 / this.ratio, 4000 / this.ratio);
      },
      drawMinimap: function () {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.globalAlpha = 0.5;

        this.ctx.fillStyle = themes[this.theme].minimapColor1;
        this.ctx.fillRect(this.c.width - 260 / this.ratio, this.c.height - 310 / this.ratio, 220 / this.ratio, 220 / this.ratio);

        this.ctx.fillStyle = themes[this.theme].minimapColor2;
        this.ctx.fillRect(this.c.width - 250 / this.ratio, this.c.height - 300 / this.ratio, 200 / this.ratio, 200 / this.ratio);

        this.ctx.globalAlpha = 1;

        this.ctx.beginPath();
        this.ctx.fillStyle = "#fff";
        this.ctx.arc(this.c.width - 250 / this.ratio + game.me.visual.position.x / 20 / this.ratio, this.c.height - 300 / this.ratio + game.me.visual.position.y / 20 / this.ratio, 5 / this.ratio, 0, 2 * Math.PI);
        this.ctx.fill();
        //this.ctx.fillRect(this.c.width / 2 - game.me.visual.position.x / this.ratio, this.c.height / 2 - game.me.visual.position.y / this.ratio, 2000 / this.ratio, 2000 / this.ratio);
      },
      drawObjects: function () {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        /*
        if (game.globalObjects === undefined) return;
        game.globalObjects.forEach(obj => {
          console.log(obj)
          //if (obj.type === 'bullet') {
          ////if (obj.objType !== 0) return;
          ////if (obj.subObjType === 0) return
          this.ctx.beginPath();
          this.ctx.fillStyle = "#000";
          this.ctx.arc(this.c.width - 250 / this.ratio + obj.pos.x / 10 / this.ratio, this.c.height - 300 / this.ratio + obj.pos.y / 10 / this.ratio, 5 / this.ratio, 0, 2 * Math.PI);
          this.ctx.fill();
          //}
        });
        */
      },
      drawGrid: function () {
        this.ctx.strokeStyle = "#000000";
        this.ctx.globalAlpha = 0.05;
        this.ctx.lineWidth = 4 / this.ratio;
        let gridSpace = 100 / this.ratio;
        let gridSetter;

        gridSetter = (this.c.width / 2 - game.me.visual.position.x / this.ratio % gridSpace) % gridSpace - 0 / this.ratio;
        while (gridSetter <= this.c.width) {
          this.ctx.beginPath();
          this.ctx.moveTo(gridSetter, 0);
          this.ctx.lineTo(gridSetter, this.c.height);
          this.ctx.stroke();
          gridSetter += gridSpace;
        }

        gridSetter = (this.c.height / 2 - game.me.visual.position.y / this.ratio % gridSpace) % gridSpace - 0 / this.ratio;
        while (gridSetter <= this.c.height) {
          this.ctx.beginPath();
          this.ctx.moveTo(0, gridSetter);
          this.ctx.lineTo(this.c.width, gridSetter);
          this.ctx.stroke();
          gridSetter += gridSpace;
        }
        this.ctx.globalAlpha = 1;
      }
    });
    game.renderers[game.renderers.length - 1].ctx.imageSmoothingEnabled = true;
    game.resize();
    game.resize();
    return game.renderers[game.renderers.length - 1];
  };
  game.socket = function (ip, onmessage, onopen, onclose, onerror) {
    if (ip === undefined)
      return null;
    var socket = new WebSocket(ip);
    socket.binaryType = "arraybuffer";
    socket.onmessage = onmessage || function () { };
    socket.onopen = onopen || function () { };
    socket.onclose = onclose || function () { };
    socket.onerror = onerror || function () { };
    return socket;
  };
  game.resize = function () {
    var renderSize = 1;
    game.renderers.forEach(function (renderer) {
      renderSize = renderer.qualitySize;
      if (document.body.clientWidth / renderer.c.width <= document.body.clientHeight / renderer.c.height) {
        renderer.c.height = document.body.clientHeight;
        renderer.c.width = renderer.c.height * 16 / 9;
        renderer.ratio = 1080 / renderer.c.height;
        renderer.c.style.height = "100%";
        renderer.c.style.width = document.body.clientHeight / renderer.c.height * renderer.c.width + 2;
        renderer.c.style.top = "0";
        renderer.top = 0;
        renderer.c.style.left = document.body.clientWidth / 2 - (document.body.clientHeight / renderer.c.height * renderer.c.width) / 2 - 1 + "px";
        renderer.left = document.body.clientWidth / 2 - (document.body.clientHeight / renderer.c.height * renderer.c.width) / 2 - 1;
      } else {
        renderer.c.width = document.body.clientWidth;
        renderer.c.height = renderer.c.width * 9 / 16;
        renderer.ratio = 1920 / renderer.c.width;
        renderer.c.style.width = "100%";
        renderer.c.style.height = document.body.clientWidth / renderer.c.width * renderer.c.height;
        renderer.c.style.left = "0";
        renderer.left = 0;
        renderer.c.style.top = document.body.clientHeight / 2 - (document.body.clientWidth / renderer.c.width * renderer.c.height) / 2 + "px";
        renderer.top = document.body.clientHeight / 2 - (document.body.clientWidth / renderer.c.width * renderer.c.height) / 2;
      }
      renderer.leftOfScreen = -1920 / 2 - ((document.body.clientWidth - renderer.c.width) / 2 * renderer.ratio);
      renderer.topOfScreen = -1080 / 2 - ((document.body.clientHeight - renderer.c.height) / 2 * renderer.ratio);
      renderer.rightOfScreen = -renderer.leftOfScreen;
      renderer.bottomOfScreen = -renderer.topOfScreen;
      renderer.c.width /= renderSize;
      renderer.c.height /= renderSize;
      renderer.ratio *= renderSize;
      renderer.ctx.imageSmoothingEnabled = renderer.smoothingEnabled;
    });
  };
  window.addEventListener('resize', game.resize, false);
  game.object = function () {
    return {
      position: new game.Vector2(0, 0),
      size: 1,
      opacity: 1,
      rotation: 0,
      type: "object",
      background: false,
      parent: null,
      objects: [],
      belowObjects: [],
      add: function (object, drawLayer, scale) {
        if (object.parent != null) {
          console.log("You can only have 1 parent per object");
          console.log(object);
          return;
        }
        object.drawLayer = drawLayer ? drawLayer : 1;
        object.scale = scale ? scale : 1;
        object.parent = this;
        this.objects.push(object);
      },
      addBelow: function (object) {
        if (object.parent != null) {
          console.log("You can only have 1 parent per object");
          return;
        }
        object.parent = this;
        this.belowObjects.unshift(object);
      },
      remove: function (object) {
        while (this.objects.indexOf(object) != -1) {
          this.objects.splice(this.objects.indexOf(object), 1);
          object.parent = null;
        }
        while (this.belowObjects.indexOf(object) != -1) {
          this.belowObjects.splice(this.belowObjects.indexOf(object), 1);
          object.parent = null;
        }
      },
      render: function (ctx, ratio, opacity) {
        opacity = Math.min(Math.max(0, opacity), 1);
        var size = this.size;
        opacity = Math.min(this.opacity * opacity, 1);
        if (opacity <= 0)
          return;
        ctx.translate(this.position.x / ratio, this.position.y / ratio);
        ctx.rotate(this.rotation);
        this.belowObjects.forEach(function (object) {
          object.render(ctx, ratio / size, opacity);
        });
        ctx.globalAlpha = opacity;
        this.renderSpecific(ctx, ratio / this.size);

        this.objects.forEach(function (object) {
          object.render(ctx, ratio / size, opacity);
        });

        ctx.rotate(-this.rotation);
        ctx.translate(-this.position.x / ratio, -this.position.y / ratio);
      },
      renderSpecific: function (ctx, ratio) {
        return;
      }
    }
  }
  game.image = function (image, x, y, width, height, opacity, offsetX, offsetY) {
    var element = new game.object();
    element.image = image || null;
    element.position = new game.Vector2(x || 0, y || 0);
    element.width = width || 100;
    element.height = height || 100;
    element.offsetX = offsetX || 0;
    element.offsetY = offsetY || 0;
    element.opacity = opacity || 1;
    element.type = "image";
    element.renderSpecific = function (ctx, ratio) {
      try {
        ctx.rotate(1.5708);
        ctx.drawImage(this.image, ((-this.width / 2) + this.offsetX) / ratio, ((-this.height / 2) + this.offsetY) / ratio, this.width / ratio, this.height / ratio);
        ctx.rotate(-1.5708);
      } catch (e) {
      }
    }
    return element;
  }
  game.text = function (text, x, y, fillStyle, font, fontSize, otherParams, opacity, align) {
    var element = new game.object();
    element.text = text || "";
    element.position = new game.Vector2(x || 0, y || 0);
    element.fillStyle = fillStyle || "#000";
    element.font = font || "Arial";
    element.fontSize = fontSize || 30;
    element.otherParams = otherParams || "";
    element.opacity = opacity || 1;
    element.type = "text";
    element.width = 0;
    element.align = align || "center";
    element.renderSpecific = function (ctx, ratio) {
      ctx.font = this.otherParams + " " + this.fontSize / ratio + "px " + this.font;
      var width = ctx.measureText(this.text).width;
      let biggest = ctx.measureText("WWWWWWWWWWWWWWWWWWWWWWWWWWp");
      element.width = width * ratio;
      ctx.fillStyle = this.fillStyle;
      if (width > biggest.width) this.text = "spammy name";
      switch (element.align) {
        case "right":
          ctx.fillText(this.text, Math.floor(-width), this.fontSize / 3 / ratio);
          break;
        case "left":
          ctx.fillText(this.text, 0, this.fontSize / 3 / ratio);
          break;
        default:
          ctx.fillText(this.text, Math.floor(-width / 2), this.fontSize / 3 / ratio);
          break;
      }
    }
    return element;
  }
  game.strokeText = function (text, x, y, strokeStyle, font, fontSize, otherParams, opacity, align) {
    var element = new game.object();
    element.text = text || "";
    element.position = new game.Vector2(x || 0, y || 0);
    element.strokeStyle = strokeStyle || "#000";
    element.font = font || "Arial";
    element.fontSize = fontSize || 30;
    element.otherParams = otherParams || "";
    element.opacity = opacity || 1;
    element.type = "text";
    element.width = 0;
    element.align = align || "center";
    element.lineWidth = 2;
    element.renderSpecific = function (ctx, ratio) {
      ctx.miterLimit = 0.1;
      ctx.font = this.otherParams + " " + this.fontSize / ratio + "px " + this.font;
      var width = ctx.measureText(this.text).width;
      element.width = width * ratio;
      ctx.strokeStyle = this.strokeStyle;
      ctx.lineWidth = this.lineWidth * this.size / ratio;
      switch (element.align) {
        case "right":
          ctx.strokeText(this.text, Math.floor(-width), this.fontSize / 3 / ratio);
          break;
        case "left":
          ctx.strokeText(this.text, 0, this.fontSize / 3 / ratio);
          break;
        default:
          ctx.strokeText(this.text, Math.floor(-width / 2), this.fontSize / 3 / ratio);
          break;
      }
    }
    return element;
  }
  game.Vector2 = function (x, y) {
    return {
      x: x || 0,
      y: y || 0,
      clone: function () {
        return new game.Vector2(this.x, this.y);
      }
    };
  }
  game.controls = function () {
    return {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      changed: false,
      clone: function () {
        var a = new game.controls();
        a.up = this.up;
        a.down = this.down;
        a.left = this.left;
        a.right = this.right;
        a.space = this.space;
        a.shift = this.shift;
        return a;
      }
    };
  }
  game.multiplayerControls = function () {
    return {
      key_up: false,
      key_down: false,
      key_left: false,
      key_right: false,
      key_w: false,
      key_s: false,
      key_a: false,
      key_d: false,
      space: false,
      shift: false,
      changed: false
    };
  }
  game.keyboard = function (control) {

    control = control || new game.controls();
    control.changedKeys = [];

    function down(e) {
      var changed = false;
      if (e.keyCode == 37 || e.keyCode == 65) {
        if (!control.left) {
          changed = true;
          control.left = true;
          control.changedKeys.push("left");
        }
      } else if (e.keyCode == 38 || e.keyCode == 87) {
        if (!control.up) {
          changed = true;
          control.up = true;
          control.changedKeys.push("up");
        }
      } else if (e.keyCode == 39 || e.keyCode == 68) {
        if (!control.right) {
          changed = true;
          control.right = true;
          control.changedKeys.push("right");
        }
      } else if (e.keyCode == 40 || e.keyCode == 83) {
        if (!control.down) {
          changed = true;
          control.down = true;
          control.changedKeys.push("down");
        }
      } else if (e.keyCode == 32) {
        if (!control.space) {
          changed = true;
          control.space = true;
          control.changedKeys.push("space");
        }
      } else if (e.keyCode == 16) {
        if (!control.shift) {
          changed = true;
          control.shift = true;
          control.changedKeys.push("shift");
        }
      }
      control.changed = changed;
    }

    window.addEventListener('keydown', down, false);

    function up(e) {
      if (e.keyCode == 37 || e.keyCode == 65) {
        control.left = false;
        control.changedKeys.push("left");
      }
      else if (e.keyCode == 38 || e.keyCode == 87) {
        control.up = false;
        control.changedKeys.push("up");
      }
      else if (e.keyCode == 39 || e.keyCode == 68) {
        control.right = false;
        control.changedKeys.push("right");
      }
      else if (e.keyCode == 40 || e.keyCode == 83) {
        control.down = false;
        control.changedKeys.push("down");
      }
      else if (e.keyCode == 32) {
        control.space = false;
        control.changedKeys.push("space");
      }
      else if (e.keyCode == 16) {
        control.shift = false;
        control.changedKeys.push("shift");
      }
      control.changed = true;
    }

    window.addEventListener('keyup', up, false);

    return control;

  }
  game.multiplayerKeyboard = function (control) {

    control = control || new game.controls();

    function down(e) {
      var changed = false;
      if (e.keyCode == 65) {
        if (!control.key_a) {
          changed = true;
          control.key_a = true;
        }
      } else if (e.keyCode == 37) {
        if (!control.key_left) {
          changed = true;
          control.key_left = true;
        }
      } else if (e.keyCode == 87) {
        if (!control.key_w) {
          changed = true;
          control.key_w = true;
        }
      } else if (e.keyCode == 38) {
        if (!control.key_up) {
          changed = true;
          control.key_up = true;
        }
      } else if (e.keyCode == 68) {
        if (!control.key_d) {
          changed = true;
          control.key_d = true;
        }
      } else if (e.keyCode == 39) {
        if (!control.key_right) {
          changed = true;
          control.key_right = true;
        }
      } else if (e.keyCode == 83) {
        if (!control.key_s) {
          changed = true;
          control.key_s = true;
        }
      } else if (e.keyCode == 40) {
        if (!control.key_down) {
          changed = true;
          control.key_down = true;
        }
      } else if (e.keyCode == 32) {
        if (!control.space) {
          changed = true;
          control.space = true;
        }
      } else if (e.keyCode == 16) {
        if (!control.shift) {
          changed = true;
          control.shift = true;
        }
      }
      control.changed = changed;
    }

    window.addEventListener('keydown', down, false);

    function up(e) {
      if (e.keyCode == 37)
        control.key_left = false;
      else if (e.keyCode == 65)
        control.key_a = false;
      else if (e.keyCode == 38)
        control.key_up = false;
      else if (e.keyCode == 87)
        control.key_w = false;
      else if (e.keyCode == 39)
        control.key_right = false;
      else if (e.keyCode == 68)
        control.key_d = false;
      else if (e.keyCode == 40)
        control.key_down = false;
      else if (e.keyCode == 83)
        control.key_s = false;
      else if (e.keyCode == 32)
        control.space = false;
      else if (e.keyCode == 16)
        control.shift = false;
      control.changed = true;
    }

    window.addEventListener('keyup', up, false);

    return control;

  }
  game.rectangle = function (x, y, width, height, color, opacity) {
    var element = new game.object();
    element.position = new game.Vector2(x || 0, y || 0);
    element.width = width || 100;
    element.height = height || 100;
    element.color = color || "#000000";
    element.opacity = opacity || 1;
    element.type = "rectangle";
    element.renderSpecific = function (ctx, ratio) {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.width * this.size / 2 / ratio, - this.height * this.size / 2 / ratio, this.width * this.size / ratio, this.height * this.size / ratio);
    }
    return element;
  }
  game.strokeRectangle = function (x, y, width, height, color, lineWidth, opacity) {
    var element = new game.object();
    element.position = new game.Vector2(x || 0, y || 0);
    element.width = width || 100;
    element.height = height || 100;
    element.color = color || "#000000";
    element.opacity = opacity || 1;
    element.lineWidth = lineWidth || 5;
    element.type = "rectangle";
    element.renderSpecific = function (ctx, ratio) {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.lineWidth * this.size / ratio;
      ctx.strokeRect(-this.width * this.size / 2 / ratio, - this.height * this.size / 2 / ratio, this.width * this.size / ratio, this.height * this.size / ratio);
    }
    return element;
  }
  game.roundRectangle = function (x, y, width, height, radius, color) {
    var element = new game.object();
    element.position = new game.Vector2(x || 0, y || 0);
    element.width = width || 100;
    element.height = height || 100;
    element.color = color || "#000000";
    element.radius = radius || 0;
    element.type = "roundRectangle";
    element.strokeStyle = -1;
    element.lineWidth = 4;
    element.renderSpecific = function (ctx, ratio) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo((-this.width / 2 + this.radius) * this.size / ratio, -this.height * this.size / 2 / ratio);
      ctx.lineTo((this.width / 2 - this.radius) * this.size / ratio, -this.height * this.size / 2 / ratio);
      ctx.quadraticCurveTo(this.width * this.size / 2 / ratio, -this.height * this.size / 2 / ratio, this.width * this.size / 2 / ratio, (-this.height / 2 + this.radius) * this.size / ratio);
      ctx.lineTo(this.width * this.size / 2 / ratio, (this.height / 2 - this.radius) * this.size / ratio);
      ctx.quadraticCurveTo(this.width * this.size / 2 / ratio, this.height * this.size / 2 / ratio, (this.width / 2 - this.radius) * this.size / ratio, this.height * this.size / 2 / ratio);
      ctx.lineTo((-this.width / 2 + this.radius) * this.size / ratio, this.height * this.size / 2 / ratio);
      ctx.quadraticCurveTo(-this.width * this.size / 2 / ratio, this.height * this.size / 2 / ratio, -this.width * this.size / 2 / ratio, (this.height / 2 - this.radius) * this.size / ratio);
      ctx.lineTo(-this.width * this.size / 2 / ratio, (-this.height / 2 + this.radius) * this.size / ratio);
      ctx.quadraticCurveTo(-this.width * this.size / 2 / ratio, -this.height * this.size / 2 / ratio, (-this.width / 2 + this.radius) * this.size / ratio, -this.height * this.size / 2 / ratio);
      ctx.fill();
    }
    return element;
  }
  game.polygon = function (x, y, points, color) {
    var element = new game.object();
    element.position = new game.Vector2(x || 0, y || 0);
    element.points = points || [
      new game.Vector2(-50, 40),
      new game.Vector2(0, -40),
      new game.Vector2(50, 40)]
    element.color = color || "#000000";
    element.shouldStroke = false;
    element.strokeColor = "#000000";
    element.lineWidth = 3;
    element.type = "polygon";
    element.renderSpecific = function (ctx, ratio) {
      var oldMiter = ctx.miterLimit;
      ctx.miterLimit = 10;
      ctx.fillStyle = this.color;
      ctx.lineWidth = this.lineWidth * this.size / ratio;
      ctx.beginPath();
      ctx.moveTo(this.points[0].x * this.size / ratio, this.points[0].y * this.size / ratio);
      for (var i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x * this.size / ratio, this.points[i].y * this.size / ratio);
      }
      ctx.closePath();
      if (this.shouldStroke) {
        ctx.strokeStyle = this.strokeColor;
        ctx.stroke();
      }
      ctx.fill();
      ctx.miterLimit = oldMiter;
    }
    return element;
  }
  game.circle = function (x, y, radius, color, opacity) {
    var element = new game.object();
    element.position = new game.Vector2(x || 0, y || 0);
    element.radius = radius || 100;
    element.color = color || "#000000";
    element.opacity = opacity || 1;
    element.type = "circle";
    element.renderSpecific = function (ctx, ratio) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * this.size / ratio, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
    }
    return element;
  }
  game.arc = function (x, y, radius, color, angle, rotation, lineWidth) {
    var element = new game.object();
    element.position = new game.Vector2(x || 0, y || 0);
    element.radius = radius || 100;
    element.color = color || "#000000";
    element.angle = angle || Math.PI;
    element.rotation = rotation || 0;
    element.lineWidth = lineWidth || 5;
    element.type = "arc";
    element.renderSpecific = function (ctx, ratio) {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.lineWidth * this.size / ratio;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * this.size / ratio, 0, this.angle);
      ctx.stroke();
    }
    return element;
  }
  game.particle = function (x, y, size, color, turn, opacityFade, xVelocity, yVelocity, initialOpacity, velocityFade) {
    var obj = new game.rectangle(x, y, size, size, color, 0.7);
    obj.turn = turn || (Math.floor(Math.random() * 2) - 0.5) * 0.2;
    obj.opacityFade = opacityFade || 1;
    obj.rotation = Math.random() * Math.PI * 2;
    obj.velocity = new game.Vector2(xVelocity || 0, yVelocity || 0);
    obj.velocityFade = 1;
    if (velocityFade !== undefined)
      obj.velocityFade = velocityFade;
    obj.opacity = initialOpacity || 1;
    obj.type = "particle";
    obj.update = function (dt) {
      obj.rotation += obj.turn * dt;
      obj.width -= 0.2 * dt;
      obj.height -= 0.2 * dt;
      obj.opacity -= 0.02 * dt * obj.opacityFade;
      obj.velocity.x *= obj.velocityFade;
      obj.velocity.y *= obj.velocityFade;
      obj.position.x += obj.velocity.x * dt;
      obj.position.y += obj.velocity.y * dt;
      if (obj.opacity <= 0 && game.particles.indexOf(obj) != -1) {
        game.particles.splice(game.particles.indexOf(obj), 1);
        if (obj.parent != null)
          obj.parent.remove(obj);
      }
    }
    game.particles.push(obj);
    return obj;
  }
  game.customParticle = function (obj, turn, opacityFade, xVelocity, yVelocity, widthFade, heightFade) {
    obj.turn = turn || (Math.floor(Math.random() * 2) - 0.5) * 0.2;
    obj.opacityFade = opacityFade || 1;
    obj.rotation = Math.random() * Math.PI * 2;
    obj.velocity = new game.Vector2(xVelocity || 0, yVelocity || 0);
    obj.widthFade = widthFade || 1;
    obj.heightFade = heightFade || 1;
    obj.type = "particle";
    obj.opacityThreshold = 0;
    obj.update = function (dt) {
      obj.rotation += obj.turn * dt;
      obj.width -= 0.4 * dt * obj.widthFade;
      obj.height -= 0.4 * dt * obj.heightFade;
      obj.opacity -= 0.02 * dt * obj.opacityFade;
      obj.position.x += obj.velocity.x * dt;
      obj.position.y += obj.velocity.y * dt;
      if (obj.opacity <= obj.opacityThreshold && game.particles.indexOf(obj) != -1) {
        game.particles.splice(game.particles.indexOf(obj), 1);
        if (obj.parent != null)
          obj.parent.remove(obj);
      }
    }
    game.particles.push(obj);
    return obj;
  }
  game.scene = function () {
    var element = new game.object();
    element.type = "scene";
    element.camera = {
      position: new game.Vector2(0, 0),
      ratio: 1,
      rotation: 0
    }
    element.render = function (ctx, ratio, opacity) {
      ratio /= this.size;
      this.opacity = Math.min(Math.max(0, this.opacity), 1);
      ctx.globalAlpha = this.opacity * opacity;
      ctx.translate(-this.camera.position.x / ratio, -this.camera.position.y / ratio);
      ctx.rotate(-this.camera.rotation);
      this.belowObjects.forEach(function (object) {
        object.render(ctx, ratio, opacity);
      });

      //! SCENE RENDER

      this.objects.sort((a, b) => {
        if (a.scale < b.scale) {
          return -1;
        }
        if (a.scale > b.scale) {
          return 1;
        }
        return 0;
      });

      this.objects.sort((a, b) => {
        if (a.drawLayer < b.drawLayer) {
          return -1;
        }
        if (a.drawLayer > b.drawLayer) {
          return 1;
        }
        return 0;
      });

      this.objects.forEach(function (object) {
        object.render(ctx, ratio, opacity);
      });
      ctx.rotate(this.camera.rotation);
      ctx.translate(this.camera.position.x / ratio, this.camera.position.y / ratio);
    }
    game.scenes.push(element);
    return element;
  }

  // Networking Portion

  game.me = { id: -1, score: 0, visual: { position: new game.Vector2(0, 0) }, new: { position: new game.Vector2(0, 0) }, old: { position: new game.Vector2(0, 0) } };
  game.ws = { readyState: -1, send: function () { }, close: function () { } };
  game.connecting = false;
  game.spectating = true;
  game.currentPackets = [];

  game.createSocket = function (serveraddr) {
    if (game.connecting)
      return;
    game.connecting = true;
    game.ws.close();
    function open() {
      game.connecting = false;
    }
    game.ws = new game.socket(serveraddr, game.messageEvent, open);
    game.ws.binaryType = "arraybuffer";
  }

  game.hasEnvs = false;

  game.serverDetails = {
    lastFrame: Date.now(),
    thisFrame: Date.now(),
    dt: 1,
    dtArray: [5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2, 5.2],
    ticksSincePacket: 0
  };

  game.clientDetails = {
    lastFrame: Date.now(),
    thisFrame: Date.now(),
    dt: 1
  };

  game.toBuffer = function (string) {
    var buf = new ArrayBuffer(string.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = string.length; i < strLen; i++) {
      bufView[i] = string.charCodeAt(i);
    }
    return buf;
  }

  game.fromBuffer = function (buffer) {
    try {
      return String.fromCharCode.apply(null, new Uint8Array(buffer));
    } catch (e) {
    }
  }

  game.selfExists = function () {
    if (!game.hasEnvs) {
      game.currentPackets.push({ type: "getEnvs" });
    }
    for (var i = 0; i < game.objects.length; i++) {
      if (game.objects[i].id == game.me.id) {
        return true;
      }
    }
    if (game.ws.readyState == 1) {
      game.currentPackets.push({ type: "getID" });
    }
  }

  game.notUpdatedIsClose = function (object) {
    if (Math.abs(game.me.new.position.x - object.new.position.x) < 1920 / 2 + 1600 && Math.abs(game.me.new.position.y - object.new.position.y) < 1080 / 2 + 1600)
      return true;
  }

  game.visualIsClose = function (object) {
    if (Math.abs(game.me.new.position.x - object.position.x) < 1920 / 2 + 1600 && Math.abs(game.me.new.position.y - object.position.y) < 1080 / 2 + 1600)
      return true;
  }

  game.lerp = function (initialValue, newValue) {
    if (game.serverDetails.ticksSincePacket > game.serverDetails.dt + 5)
      return (newValue - initialValue) / game.serverDetails.dt * (game.serverDetails.dt + 5) + initialValue;
    return (newValue - initialValue) / game.serverDetails.dt * game.serverDetails.ticksSincePacket + initialValue;
  }

  game.getObj = function (id) {
    for (var i = 0; i < game.objects.length; i++) {
      if (game.objects[i].id == id) {
        return game.objects[i];
      }
    }
    return null;
  }

  game.askForObj = function (id) {
    game.currentPackets.push({ type: "getObject", object: { id: id } });
  }

  game.onGetEnvs = function (envs) {

  }

  game.packetFunctions = {
    "setID": function (packet) {
      console.log(packet.id)
      game.spectating = packet.s;
      for (var i = 0; i < game.objects.length; i++) {
        if (game.objects[i].id == packet.id) {
          game.me = game.objects[i];
        }
      }
    },
    // Add
    "x": function (packet) {
      if (game.getObj(packet.i) != null) {
        return null;
      }
      var obj = {
        new: {
          position: new game.Vector2(packet.x, packet.y),
          mouseAngle: packet.a / 100,
          rotation: packet.a / 100
        },
        old: {
          position: new game.Vector2(packet.x, packet.y),
          mouseAngle: packet.a / 100,
          rotation: packet.a / 100
        },
        actualOld: {
          position: new game.Vector2(packet.x, packet.y),
          mouseAngle: packet.a / 100,
          rotation: packet.a / 100
        },
        id: packet.i,
        ticksAsleep: 0,
        visual: new game.object(),
        type: packet.b,
        needsUpdate: packet.n,
        drawLayer: packet.drawLayer
      };
      if (obj.type === "player") obj.cannon = new game.object();
      if (obj.type === "player") obj.turrets = [];
      if (obj.type === "player") obj.playerName = new game.object();
      if (packet.maxHealth !== undefined && packet.health !== undefined) obj.healthBar = new game.object();

      if (packet.maxHealth !== undefined) obj.maxHealth = packet.maxHealth;
      if (packet.health !== undefined) obj.health = packet.health;

      if (packet.objType !== undefined) obj.objType = packet.objType;
      if (packet.subObjType !== undefined) obj.subObjType = packet.subObjType;
      if (game.types[packet.b] === undefined) {
        console.log(packet.b);
      }
      game.types[packet.b].create(obj, packet);

      obj.visual.position.x = obj.new.position.x;
      obj.visual.position.y = obj.new.position.y;
      obj.visual.rotation = obj.new.rotation;
      if (obj.cannon) {
        obj.cannon.position.x = obj.new.position.x;
        obj.cannon.position.y = obj.new.position.y;
        obj.cannon.cannon = obj.new.mouseAngle;
      }
      if (obj.playerName) {
        obj.playerName.position.x = obj.new.position.x;
        obj.playerName.position.y = obj.new.position.y + 60;
      }
      if (obj.healthBar) {
        obj.healthBar.position.x = obj.new.position.x;
        obj.healthBar.position.y = obj.new.position.y - 60;
      }
      if (obj.turrets !== undefined) {
        obj.turrets.forEach(turret => {
          turret.position.x = obj.new.position.x;
          turret.position.y = obj.new.position.y;
          turret.rotation = obj.new.mouseAngle + turret.offsetAngle;
        });
      }
      game.objects.push(obj);
      return;
    },
    // Update
    "y": function (packet) {
      if (game.getObj(packet.a[0]) == null) {
        game.askForObj(packet.a[0]);
        return;
      }
      var obj = game.getObj(packet.a[0]);
      obj.ticksAsleep = 0;
      obj.old.position = obj.visual.position.clone();
      obj.old.rotation = obj.visual.rotation;
      if (obj.cannon) {
        obj.old.mouseAngle = obj.cannon.rotation;
      }
      obj.actualOld.position = obj.new.position.clone();
      obj.actualOld.rotation = obj.new.rotation;
      obj.actualOld.mouseAngle = obj.new.mouseAngle;
      obj.new.position = new game.Vector2(packet.a[1], packet.a[2]);

      obj.tank = packet.tank;
      obj.tier = packet.tier;
      if (obj.tank !== undefined) obj.visual.image.src = `./client/images/tanks/${obj.tank}/${obj.tier}/tank.png`;
      if (packet.turrets !== undefined)
        obj.turrets.forEach(turret => {
          turret.parent.remove(turret);
        });
      obj.turrets = [];
      if (packet.turrets !== undefined)
        packet.turrets.forEach(turret => {
          let turretImg = new Image();
          switch (turret.type) {
            case 0:
              turretImg.src = `./client/images/cannons/default.png`;
              break;
            case 1:
              turretImg.src = `./client/images/cannons/shotgun.png`;
              break;
            case 2:
              turretImg.src = `./client/images/cannons/sniper.png`;
              break;
            case 3:
              turretImg.src = `./client/images/cannons/machinegun.png`;
              break;
            default:
              turretImg.src = `./client/images/cannons/default.png`;
              break;
          }
          let turretObj = new game.image(turretImg, 0, 0, 220, 220);
          turretObj.offsetX = turret.offsetX || 0;
          turretObj.offsetY = turret.offsetY || 0;
          turretObj.offsetAngle = turret.offsetAngle || 0;
          obj.turrets.push(turretObj);
          game.scenes[0].add(turretObj, 3);
        });

      obj.health = packet.health;

      if (isNaN(obj.old.position.x)) {
        obj.old.position.x = obj.new.position.x;
        obj.actualOld.position.x = obj.new.position.x;
        console.log("NaN X Value");
      }
      if (isNaN(obj.old.position.y)) {
        obj.old.position.y = obj.new.position.y;
        obj.actualOld.position.y = obj.new.position.y;
        console.log("NaN Y Value");
      }
      if (Math.abs(obj.visual.position.x - obj.new.position.x) < 0.3) {
        obj.old.position.x = obj.new.position.x;
      }
      if (Math.abs(obj.visual.position.y - obj.new.position.y) < 0.3) {
        obj.old.position.y = obj.new.position.y;
      }
      obj.new.rotation = packet.a[3] / 100;
      if (Math.abs(obj.old.rotation - obj.new.rotation) > Math.PI) {
        if (obj.old.rotation > obj.new.rotation)
          obj.old.rotation -= Math.PI * 2;
        else
          obj.old.rotation += Math.PI * 2;
      }
      obj.new.mouseAngle = packet.angle;
      if (Math.abs(obj.old.mouseAngle - obj.new.mouseAngle) > Math.PI) {
        if (obj.old.mouseAngle > obj.new.mouseAngle)
          obj.old.mouseAngle -= Math.PI * 2;
        else
          obj.old.mouseAngle += Math.PI * 2;
      }
      game.usedIDs.push(obj.id);
      game.types[obj.type].updatePacket(obj, packet);
    },
    // Remove
    "z": function (packet) {
      for (var i = 0; i < game.objects.length; i++) {
        if (game.objects[i].id == packet.i) {
          if (game.types[game.objects[i].type].remove(game.objects[i], packet))
            return;
          if (game.objects[i].visual.parent != null)
            game.objects[i].visual.parent.remove(game.objects[i].visual);
          if (game.objects[i].cannon != null) if (game.objects[i].cannon.parent != null)
            game.objects[i].cannon.parent.remove(game.objects[i].cannon);
          if (game.objects[i].turrets != null) game.objects[i].turrets.forEach(turret => {
            if (turret != null) turret.parent.remove(turret);
          });
          if (game.objects[i].playerName != null) if (game.objects[i].playerName.parent != null)
            game.objects[i].playerName.parent.remove(game.objects[i].playerName);
          if (game.objects[i].healthBar != null) if (game.objects[i].healthBar.parent != null)
            game.objects[i].healthBar.parent.remove(game.objects[i].healthBar);
          game.objects.splice(i, 1);
          break;
        }
      }
    },
    // Get envs
    "e": function (packet) {
      if (!game.hasEnvs) {
        game.hasEnvs = true;
        game.envs = packet.envs;
        game.onGetEnvs(game.envs);
      }
    },
    // Add global object
    "g": function (packet) {
      game.globalObjects.push(packet.obj);
    },
    // Remove global object
    "h": function (packet) {
      for (let i = 0; i < game.globalObjects.length; i++) {
        const element = game.globalObjects[i];
        if (element.i === packet.i) game.globalObjects.splice(i, 1);
      }
    },
    // Set globals array
    "i": function (packet) {
      game.globalObjects = packet.list;
    },
    // Death
    "d": function (packet) {
      document.getElementById('death-screen').style.display = "block";
      let ms = packet.time;
      let seconds = ~~(ms / 1000);
      let minutes = ~~(seconds / 60);
      let hours = ~~(minutes / 60);
      ms -= seconds * 1000;
      seconds -= minutes * 60
      minutes -= hours * 60;
      let totalTime = "Time alive: ";
      if (hours) totalTime += `${hours}h `;
      if (minutes) totalTime += `${minutes}m `;
      if (seconds) totalTime += `${seconds}s `;
      totalTime += `${ms}ms`;
      document.getElementById('time').innerHTML = totalTime;
      document.getElementById("return").addEventListener("click", () => {
        document.getElementById('death-screen').style.display = "none";
        document.getElementById('menu').style.display = "flex";
      });
    }
  };
  game.addPacketType = function (type, func) {
    game.packetFunctions[type] = func;
  }
  game.types = [];
  game.objects = [];
  game.globalObjects = [];
  game.usedIDs = [];

  game.messageEvent = function (message) {
    game.serverDetails.thisFrame = Date.now();
    /*for( var i = 0; i < game.serverDetails.dtArray.length - 1; i++ ) {
      game.serverDetails.dtArray[ i ] = game.serverDetails.dtArray[ i + 1 ];
    }
    game.serverDetails.dtArray[ game.serverDetails.dtArray.length - 1 ] = Math.max( Math.min( ( game.serverDetails.thisFrame - game.serverDetails.lastFrame ) / 16, 8.2 ), 2.2 );
    var sum = 0;
    for( var i = 0; i < game.serverDetails.dtArray.length; i++ ) {
      sum += game.serverDetails.dtArray[ i ];
    }
    game.serverDetails.dt = sum / game.serverDetails.dtArray.length;*/
    game.serverDetails.dt = 5.5; //4.6
    game.serverDetails.lastFrame = game.serverDetails.thisFrame;
    //try {
    if (msgpack !== undefined) {
      var packets = msgpack.decode(new Uint8Array(message.data));
      for (var i = 0; i < packets.length; i++) {
        var packet = packets[i];
        if (game.packetFunctions[packet.t] !== undefined)
          game.packetFunctions[packet.t](packet);
        else {
          console.log("Encountered issue: unknown packet type");
          console.log(packets);
        }
      }
    }
    /*game.particles.forEach( function( particle ) {
      particle.update( 1 );
    } );*/
    for (var i = 0; i < game.objects.length; i++) {
      game.objects[i].ticksAsleep++;
      if (game.usedIDs.indexOf(game.objects[i].id) == -1) {
        game.objects[i].old.position.x = game.objects[i].visual.position.x;
        game.objects[i].old.position.y = game.objects[i].visual.position.y;
        game.objects[i].old.rotation = game.objects[i].visual.rotation;
        if (game.objects[i].cannon) game.objects[i].old.mouseAngle = game.objects[i].cannon.rotation;
      }
      if (((game.objects[i].needsUpdate && (game.objects[i].ticksAsleep > 201 && (game.objects[i].old.position.x == game.objects[i].new.position.x && game.objects[i].old.position.y == game.objects[i].new.position.y && game.objects[i].old.rotation == game.objects[i].new.rotation))) || (!game.objects[i].needsUpdate && game.objects[i].ticksAsleep >= 120 && !game.notUpdatedIsClose(game.objects[i]))) && game.usedIDs.indexOf(game.objects[i].id) == -1) {
        if (game.types[game.objects[i].type].remove(game.objects[i], {}))
          continue;
        if (game.objects[i].visual.parent != null)
          game.objects[i].visual.parent.remove(game.objects[i].visual);
        if (game.objects[i].cannon != null) if (game.objects[i].cannon.parent != null)
          game.objects[i].cannon.parent.remove(game.objects[i].cannon);
        if (game.objects[i].turrets != null) game.objects[i].turrets.forEach(turret => {
          if (turret.parent != null) turret.parent.remove(turret);
        });
        if (game.objects[i].playerName != null) if (game.objects[i].playerName.parent != null)
          game.objects[i].playerName.parent.remove(game.objects[i].playerName);
        if (game.objects[i].healthBar != null) if (game.objects[i].healthBar.parent != null)
          game.objects[i].healthBar.parent.remove(game.objects[i].healthBar);
        game.objects.splice(i, 1);
      }
    }
    game.usedIDs = [];
    game.selfExists();
    game.serverDetails.ticksSincePacket = 0;
    /*} catch( e ) {
            console.log( "Caught Error, plx report" );
    }*/
  }
  game.update = function () {
    var currentFPS = Math.max(fps.getFPS(), 30);
    game.serverDetails.ticksSincePacket += 1 / (currentFPS / 60);
    //game.serverDetails.ticksSincePacket += 1;
    for (var i = 0; i < game.objects.length; i++) {
      var obj = game.objects[i];
      obj.visual.rotation = game.lerp(obj.old.rotation, obj.new.rotation);
      obj.visual.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
      obj.visual.position.y = game.lerp(obj.old.position.y, obj.new.position.y);
      if (obj.cannon) {
        obj.cannon.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
        obj.cannon.position.y = game.lerp(obj.old.position.y, obj.new.position.y);
        obj.cannon.rotation = game.lerp(obj.old.mouseAngle, obj.new.mouseAngle);
      }
      if (obj.playerName) {
        obj.playerName.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
        obj.playerName.position.y = game.lerp(obj.old.position.y, obj.new.position.y) + 60;
      }
      if (obj.healthBar) {
        obj.healthBar.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
        obj.healthBar.position.y = game.lerp(obj.old.position.y, obj.new.position.y) - 60;

        if (obj.healthBar.type !== "roundRectangle") { if (obj.health < obj.maxHealth) { obj.healthBar = new game.roundRectangle(0, 0, (obj.health / obj.maxHealth) * 100, 10, 5, "#FF0000"); this.scenes[0].add(obj.healthBar); } }
        else { obj.healthBar.width = (obj.health / obj.maxHealth) * 100; }
      }
      if (obj.turrets !== undefined) {
        obj.turrets.forEach(turret => {
          turret.position.x = game.lerp(obj.old.position.x, obj.new.position.x);
          turret.position.y = game.lerp(obj.old.position.y, obj.new.position.y);
          turret.rotation = game.lerp(obj.old.mouseAngle + turret.offsetAngle, obj.new.mouseAngle + turret.offsetAngle);
        });
      }
      game.types[obj.type].tickUpdate(obj);
    }
    game.clientDetails.thisFrame = Date.now();
    game.clientDetails.dt = Math.min((game.clientDetails.thisFrame - game.clientDetails.lastFrame) / 16.67, 2);
    game.clientDetails.lastFrame = game.clientDetails.thisFrame;
    game.particles.forEach(function (particle) {
      particle.update(game.clientDetails.dt * 1.2);
    });
    if (game.ws.readyState == 1 && game.currentPackets.length > 0) {
      game.ws.send(msgpack.encode(game.currentPackets));
      game.currentPackets = [];
    }
  }
  game.addType = function (type, create, tickUpdate, updatePacket, remove) {
    game.types[type] = {
      create: create,
      tickUpdate: tickUpdate || function (obj) { },
      updatePacket: updatePacket || function (obj, packet) { },
      remove: remove || function (obj) { }
    };
  }
  game.addType(
    "spectator",
    function (obj, packet) {
      obj.visual = new game.object();
    },
    function () { },
    function () { }
  );
  return game;
}
requestFrame = function (callback) {
  (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function (callback) {
      setTimeout(callback, 1000 / 60);
    }
  )(callback);
};