const Dep = require('./dep');

class Main extends Dep {
  constructor() {
    super();
    this.name = this.constructor.name;
  }
  static name = "main";
}

t.is(new Main().name, "main");
