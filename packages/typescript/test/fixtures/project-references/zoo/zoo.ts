// import Animal from '../animals/index';
import { Dog, createDog } from '../animals/index';

export default function createZoo(): Array<Dog> {
  return [createDog()];
}
