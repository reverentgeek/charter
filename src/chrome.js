"use strict";
const util = require( "util" );
const exec = util.promisify( require( "child_process" ).exec );

module.exports = pathToChrome => {
	const renderPdf = async ( src, dst ) => {
		await exec( `${ pathToChrome } --headless --disable-gpu --no-margins --print-to-pdf=/${ dst } ${ src }` );
	};
	
	return {
		renderPdf
	};
};
