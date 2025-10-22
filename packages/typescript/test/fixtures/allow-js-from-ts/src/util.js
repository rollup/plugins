export default function util() {
  const obj = { prop: { nested: 7 } };
  const a = obj.prop?.nested;
  const c = {};
  c.timeout ??= 9;
  return [a, c.timeout];
}
