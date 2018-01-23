const PIXI = require('pixi.js');
const Camera = require('./camera.js');
const rbush = require('rbush');

/**
 * World with camera control
 */
class World extends PIXI.Container {
  /**
   * @param {PIXI.Container} config.container
   * @param {Number} config.width
   * @param {Number} config.height
   * @param {Boolean=true} config.culling
   */
  constructor(config) {
    super();

    this.config = Object.assign({
      culling: true
    }, config);
    this.camera = new Camera(this.config.width, this.config.height);
    this.camera.on('frustrumChanged', camera => this.onCameraChange(camera));
  
    this.worldContainer = new PIXI.Container();
    super.addChild(this.worldContainer);

    let clip = new PIXI.filters.AlphaFilter();
    clip.padding = 0;
    this.filters = [clip];
    this.filterArea = new PIXI.Rectangle(0, 0, this.config.width, this.config.height);

    if (this.config.culling) {
      this.tree = rbush();
    }
  }

  onCameraChange(camera) {
    this.worldContainer.setTransform(
      -camera.position.x,
      -camera.position.y,
      1 / camera.scale.x,
      1 / camera.scale.y,
      -camera.rotation,
      -camera.skew.x,
      -camera.skew.y,
      camera.pivot.x,
      camera.pivot.y
    );
  }

  /**
   * override methods
   */
  addChild(child) {
    this.insertToTree(child);
    return this.worldContainer.addChild(child);
  }
  addChildAt(child, index) {
    this.insertToTree(child);
    return this.worldContainer.addChildAt(child, index);
  }
  swapChildren(child, child2) {
    return this.worldContainer.swapChildren(child, child2);
  }
  getChildIndex(child) {
    return this.worldContainer.getChildIndex(child);
  }
  setChildIndex(child, index) {
    return this.worldContainer.setChildIndex(child, index);
  }
  getChildAt(index) {
    return this.worldContainer.getChildAt(index);
  }
  removeChild(child) {
    this.removeFromTree(child);
    return this.worldContainer.removeChild(child);
  }
  removeChildAt(index) {
    const child = this.getChildAt(index);
    this.removeFromTree(child);
    return this.worldContainer.removeChildAt(index);
  }
  removeChildren(beginIndex = 0, endIndex) {
    let removedChildren = this.worldContainer.removeChildren(beginIndex, endIndex);
    removedChildren.forEach(child => removeFromTree(child));
    return removedChildren;
  }

  /**
   * get children
   */
  getChildren() {
    return this.worldContainer.children;
  }
  /**
   * set children
   */
  setChildren(value) {
    this.worldContainer.children = value;
  }

  /**
   * insert instance to tree
   * @param {PIXI.DisplayObject} child
   */
  insertToTree(child) {
    if (!this.config.culling) return;

    let bound = child.getLocalBounds();
    child.__culling = {
      minX: bound.left,
      minY: bound.top,
      maxX: bound.right,
      maxY: bound.bottom,
      instance: child
    };
    this.tree.insert(child.__culling);
  }

  /**
   * remove instance from tree
   * @param {PIXI.DisplayObject} child
   */
  removeFromTree(child) {
    if (!this.config.culling) return;

    this.tree.remove(child.__culling);
    child.__culling = undefined;
  }

  /**
   * set origin of camera
   * @param {PIXI.Point?} origin will be center of frustrum if not provided
   */
  setOrigin(origin = this.camera.getFrustrumCenter()) {
    let lastPosX = this.camera.position.x;
    let lastPosY = this.camera.position.y;
    let lastPivX = this.camera.pivot.x;
    let lastPivY = this.camera.pivot.y;
    let scaleX = this.camera.scale.x;
    let scaleY = this.camera.scale.y;
    
    this.camera.pivot.set(origin.x, origin.y);
    this.camera.position.set(
      lastPosX - (origin.x - lastPivX) / scaleX,
      lastPosY - (origin.y - lastPivY) / scaleY
    );
  }

  /**
   * set camera's size
   * useful if we need to adjust the size after camera is initialized
   * @param {Number} width
   * @param {Number} height
   */
  setCameraSize(width, height) {
    this.config.width = this.filterArea.width = width;
    this.config.height = this.filterArea.height = height;
    this.camera.emit('changeSize', width, height);
  }

  /**
   * override
   */
  _renderWebGL() {
    // update filter area
    if (this.filterArea.x !== this.x) this.filterArea.x = this.x;
    if (this.filterArea.y !== this.y) this.filterArea.y = this.y;
    
    if (!this.config.culling) return;
    
    if (this.camera.frustrumChanged) {
      this.camera.frustrumChanged = false;

      // only show the objects within frustrum
      this.tree.all().forEach(info => {
        info.instance.visible = false;
      });
      
      this.tree.search({
        minX: this.camera.frustrum.left,
        minY: this.camera.frustrum.top,
        maxX: this.camera.frustrum.right,
        maxY: this.camera.frustrum.bottom
      }).forEach(info => {
        info.instance.visible = true;
      });
    }
  }
}

module.exports = World;