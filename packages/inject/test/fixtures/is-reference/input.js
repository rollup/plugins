import { bar as foo } from "path";
console.log({ bar: foo });
class Foo { bar () { console.log(this) } }
export { Foo }
export { foo as bar }