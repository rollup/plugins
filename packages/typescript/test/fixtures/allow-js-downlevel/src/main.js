export default function run() {
  const obj = { prop: { nested: 1 } };
  const a = obj.prop?.nested;
  const b = {};
  b.timeout ??= 123;
  return [a, b.timeout];
}
