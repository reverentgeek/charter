"use strict";

const path = require( "path" );
const { renderPdf } = require( "../src/pdf" );
const processor = require( "../src/processor" );

( async () => {
	const buildFolder = await processor.getBuildFolder();
	const files = await processor.getAllHtmlFiles( buildFolder );
	const pdfFolder = path.join( __dirname, "..", "pdf" );
	const srcDstFiles = files.map( f => {
		const src = "file://" + path.join( buildFolder, f );
		const dstFileName = path.basename( f, path.extname( f ) ) + ".pdf";
		const dst = path.join( pdfFolder, dstFileName );
		return { src, dst };
	} );
	console.time( "time" );
	console.log( `rendering pdf${ srcDstFiles.length > 1 ? "s": "" }...` );
	await renderPdf( srcDstFiles );
	console.timeEnd( "time" );
} )();
