let warned = {};
export function warnOnce ( ctx, msg ) {
	if ( warned[ msg ] ) return;
	warned[ msg ] = true;
	ctx.warn( msg );
}
