export function assign ( target, source ) {
	Object.keys( source ).forEach( key => {
		target[ key ] = source[ key ];
	});
	return target;
}

let warned = {};
export function warnOnce ( msg ) {
	if ( warned[ msg ] ) return;
	warned[ msg ] = true;
	console.warn( msg ); // eslint-disable-line no-console
}
