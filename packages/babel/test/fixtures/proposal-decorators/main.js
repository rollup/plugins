/* eslint-disable @typescript-eslint/no-unused-vars */

@annotation
export default class MyClass {}

function annotation(target) {
  target.annotated = true;
}
