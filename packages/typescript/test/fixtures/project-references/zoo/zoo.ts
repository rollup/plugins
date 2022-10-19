// import Animal from '../animals/index';
import type { Dog} from '../animals/index';
import { createDog } from '../animals/index';

export default function createZoo(): Array<Dog> {
  return [createDog()];
}
