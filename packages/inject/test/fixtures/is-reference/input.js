import { bar as foo } from "path";
console.log({ bar: foo });
console.log(class Foo { bar () {} });
export { foo as bar }