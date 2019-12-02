export default async function ( n: number ) {
	while ( --n ) {
		await delay( 10 );
	}
}

function delay ( interval: number ) {
	return new Promise( resolve => setTimeout( resolve, interval ) );
}
