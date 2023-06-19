exports.augmentThis = function augmentThis() {
  this.x = 'x';
};

this.y = 'y';

exports.classThis = class classThis {
  constructor(){
    class _classThis {
      y = 'yyy'
      yyy = this.y
    }
    this._instance = new _classThis()
  }
  y = 'yy'
  yy = this.y
}
