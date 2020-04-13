declare module 'picomatch' {
  const picomatch: (pattern: string, options?: micromatch.Options) => (str: string) => boolean;
  export default picomatch;
}
