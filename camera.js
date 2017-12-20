const PIXI = require('pixi.js');

/**
 * Camera
 */
class Camera {
  /**
   * @param {PIXI.Container} config.container
   * @param {Number} config.width
   * @param {Number} config.height
   * @param {Function} config.onChange
   */
  constructor(config = {}) {
    this.config = config;

    this.position = new PIXI.ObservablePoint(this.update, this, 0, 0);
    this.scale = new PIXI.ObservablePoint(this.update, this, 1, 1);
    this.pivot = new PIXI.ObservablePoint(this.update, this, 0, 0);
    this.skew = new PIXI.ObservablePoint(this.updateSkew, this, 0, 0);
    
    this.frustrum = new PIXI.Rectangle(0, 0, this.config.width, this.config.height);
    this.frustrumCenter = new PIXI.Point();
    this.frustrumChanged = true;

    this._rotation = 0;
    this._cx = 1; // cos rotation + skewY;
    this._sx = 0; // sin rotation + skewY;
    this._cy = 0; // cos rotation + Math.PI/2 - skewX;
    this._sy = 1; // sin rotation + Math.PI/2 - skewX;
  }

  updateSkew() {
    this._cx = Math.cos(this._rotation + this.skew._y);
    this._sx = Math.sin(this._rotation + this.skew._y);
    this._cy = -Math.sin(this._rotation - this.skew._x); // cos, added PI/2
    this._sy = Math.cos(this._rotation - this.skew._x); // sin, added PI/2

    this.update();
  }

  update() {
    this.frustrum.x = this.position.x * this.scale.x + this.pivot.x;
    this.frustrum.y = this.position.y * this.scale.y + this.pivot.y;
    this.frustrum.width = this.config.width * this.scale.x;
    this.frustrum.height = this.config.height * this.scale.y;
    this.frustrumChanged = true;
    this.config.onChange();
  }

  get rotation() {
    return this._rotation;
  }

  set rotation(value) {
    this._rotation = value;
    this.updateSkew();
  }

  /**
   * get center point of current frustrum
   * @returns {PIXI.Point}
   */
  getFrustrumCenter() {
    this.frustrumCenter.set(
      (this.frustrum.left + this.frustrum.right) / 2,
      (this.frustrum.top + this.frustrum.bottom) / 2
    );
    return this.frustrumCenter;
  }
}

module.exports = Camera;