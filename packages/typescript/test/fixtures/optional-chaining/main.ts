interface OC {
  a: number;
  b?: {
    c?: number;
  };
}
const o = { a: 1 } as OC;
export default o.b?.c ?? 'NOT FOUND';
