class Bar {
	baz () {
		alert( 'baz' );
	}
}

export class Foo extends Bar {
	baz () {
		super.baz();
	}
}
