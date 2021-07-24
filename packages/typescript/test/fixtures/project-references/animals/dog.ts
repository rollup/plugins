import Animal from '.';

import { makeRandomName } from '../core/utilities';


export interface Dog extends Animal {
  name: string;
  woof(): void;
}

export function createDog(): Dog {
  return {
    size: 'medium',
    woof(this: Dog) {
      // eslint-disable-next-line no-console
      console.log(`${this.name} says "Woof"!`);
    },
    name: makeRandomName()
  };
}
