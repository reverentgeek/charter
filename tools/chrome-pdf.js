"use strict";

const path = require( "path" );
const pathToChrome = "/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome";
const { renderPdf } = require( "../src/chrome" )( pathToChrome );
const processor = require( "../src/processor" );

( async () => {
	const buildFolder = await processor.getBuildFolder();
	const files = await processor.getAllHtmlFiles( buildFolder );
	const pdfFolder = path.join( __dirname, "..", "pdf" );
	for( let i = 0; i < files.length; i++ ) {
		let src = path.join( buildFolder, files[i] );
		const dstFileName = path.basename( files[i], path.extname( files[i] ) ) + ".pdf";
		let dst = path.join( pdfFolder, dstFileName );
		console.log( `saving chord chart as ${ dstFileName }...` );
		await renderPdf( src, dst );
	}
} )();
