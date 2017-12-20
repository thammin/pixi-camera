# pixi-camera
simple camera for pixi.js

# Install
```sh
# install from master branch
$npm install thammin/pixi-camera

# install from certain tag
$npm install thammin/pixi-camera#v1.0.0
```

# Usage
```js
const World = require('pixi-camera');

// this is our world with camera control enabled
// its extend from PIXI.Container
const world1 = new World({
  width: 300,
  height: 300 // frustrum camera size
});
app.stage.addChild(world1); // add this world to anywhere in the scene graph

// we can add anything as usual to our wolrd1
const box = new PIXI.Graphics();
box.beginFill(Math.floor(Math.random() * 0xFFFFFF));
box.drawRect(10, 10, 50, 50);
world1.addChild(box);

const camera = world1.camera; // this is our world1's camera
camera.position.set(100, 100); // set the camera to position x:100 y:100
camera.scale.set(1.5, 1.5); // or any other pixi.js properties
```

# License
MIT
