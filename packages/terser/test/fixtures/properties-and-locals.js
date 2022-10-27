function recurse(count) {
	if (count > 0) return recurse(count - 1);
	return count;
}
const obj = {
	foo: 1,
	_priv: 2
};
console.log(obj, recurse(10));
