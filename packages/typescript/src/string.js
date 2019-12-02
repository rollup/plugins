export default function endsWith(str, tail) {
  return !tail.length || str.slice(-tail.length) === tail;
}
