class A {
  getArgs: () => any[];

  constructor(...args: any[]) {
    this.getArgs = () => args;
  }
}

export default A;
