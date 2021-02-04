export default {
  extensions: ['js', 'ts'],
  files: ['!**/fixtures/**', '!**/output/**', '!**/helpers/**', '!**/recipes/**', '!**/types.ts'],
  require: ['ts-node/register', 'esm']
};
