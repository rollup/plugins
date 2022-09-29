export default {
  workerThreads: false,
  extensions: ['js', 'ts'],
  files: ['!**/fixtures/**', '!**/output/**', '!**/helpers/**', '!**/recipes/**', '!**/types.ts'],
  require: ['ts-node/register', 'esm']
};
