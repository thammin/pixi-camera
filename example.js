const PIXI = require('pixi.js');
const World = require('.');
const Connector = require('pixi-hammer');
const gsap = require('gsap');

// initialize with PIXI application
document.body.style.margin = '0px';
const app = new PIXI.Application(555, 555);
document.body.appendChild(app.view);

// a simple background color for visualization uses
const bg = new PIXI.Graphics();
bg.beginFill(0xFFFFFF, 0.5);
bg.drawRect(100, 100, 300, 300);
app.stage.addChild(bg);

// this is our world with camera control
const world = new World({
  width: 300,
  height: 300
});
world.position.set(100, 100);
app.stage.addChild(world);

world.camera.pivot.set(100, 0);

// insert some squares into our world
for (var i = 0; i < (300 / 10) * (300 / 10); i++) {
  const box = new PIXI.Graphics();
  box.beginFill(Math.floor(Math.random() * 0xFFFFFF));
  box.drawRect((i % (300 / 10)) * 10, Math.floor(i / (300 / 10)) * 10, 10, 10);
  world.addChild(box);
}

console.log(`scene: ${app.renderer.width}x${app.renderer.height}`);
console.log(`world: ${world.width}x${world.height}`);

// hit area for our world for pixi-hammer
let rect = new PIXI.Graphics();
rect.beginFill(0x000000);
rect.drawRect(0, 0, app.renderer.width, app.renderer.height);
world.hitArea = rect;

// panning control
const connector = new Connector(app);
let panstart, pinchstart;
connector.listen(world, 'panstart', function(e) {
  panstart = {
    origin: new PIXI.Point()
  };
  panstart.origin.copy(this.camera.position);
});

connector.listen(world, 'panmove', {
  threshold: 0
}, function(e) {
  if (!panstart) return;

  // change camera position
  this.camera.position.set(
    panstart.origin.x - e.deltaX,
    panstart.origin.y - e.deltaY
  );

  debugBoxCulling();
});

const t = 800;
const d = 5;
let animating;
connector.listen(world, 'panend', function(e) {
  panstart = undefined;
  animating && animating.kill();
  animating = gsap.TweenLite.to(this.camera.position, t / 1000, {
    x: this.camera.position.x + -e.velocityX * t / d,
    y: this.camera.position.y + -e.velocityY * t / d,
    ease: gsap.Quart.easeOut
  });
});

// mouse wheel control
let isWheelling = false;
let timer;
app.view.addEventListener('wheel', function(e) {
  e.preventDefault();

  if (!isWheelling) {
    world.setOrigin();
    isWheelling = true;
  } else {
    clearTimeout(timer);
  }

  let buff = e.deltaY / 1000 * (0.5);
  // change camera scale
  world.camera.scale.set(
    Math.min(Math.max(world.camera.scale.x + buff, 0.5), 2)
  );

  timer = setTimeout(() => {
    isWheelling = false;
  }, 250);
});

let box;
connector.listen(world, 'tap', function(e) {
  if (box) {
    box.scale.set(2);
    world.updateCullingBound(box);
  } else {
    box = new PIXI.Graphics();
    box.name = 'box';
    box.clear();
    box.beginFill(0xFFFFFF, 0.7);
    box.drawRect(100, 100, 100, 100);
    box.position.set(70);
    box.pivot.set(50);
    box.scale.set(1.5);
    world.addChild(box);
    debugBoxCulling();
  }
});

// debug info for box culling;
const debug = document.createElement('div');
debug.style.position = 'absolute';
debug.style.top = debug.style.left = '50px';
debug.style.color = 'white';
document.body.appendChild(debug);
function debugBoxCulling() {
  if (box) {
    debug.innerHTML = box.visible;  
  }
}