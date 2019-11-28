@annotation
export default class MyClass {}

function annotation(target) {
	target.annotated = true;
}
