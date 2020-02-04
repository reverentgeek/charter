"use strict";

const fs = require( "fs-extra" );
const path = require( "path" );

( async () => {
	const buildFolder = path.join( __dirname, "..", "build" );
	const assetFolder = path.join( __dirname, "..", "src", "assets" );
	const pdfFolder = path.join( __dirname, "..", "pdf" );
	await fs.emptyDir( pdfFolder );
	await fs.emptyDir( buildFolder );
	await fs.ensureDir( path.join( buildFolder, "assets" ) );
	await fs.copy( assetFolder, path.join( buildFolder, "assets" ) );	
} )();
