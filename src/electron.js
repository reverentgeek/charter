"use strict";
const path = require( "path" );
const util = require( "util" );
const exec = util.promisify( require( "child_process" ).exec );

const pdf = path.join( __dirname, "..", "node_modules", ".bin", "electron-pdf" );

async function renderPdf( src, dst ) {
	await exec( `${ pdf } --pageSize=Letter --marginsType=0  ${ src } ${ dst }` );
}

module.exports = { renderPdf };
