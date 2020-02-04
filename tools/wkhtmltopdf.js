"use strict";

const handler = require( "serve-handler" );
const http = require( "http" );
const path = require( "path" );
const util = require( "util" );
const exec = util.promisify( require( "child_process" ).exec );

const processor = require( "../src/processor" );

const port = 3000;

async function renderPdf( title, pdfFolder ) {
	console.log( `saving ${ title } to pdf...` );
	await exec( `wkhtmltopdf -T 6 -R 6 -B 6 -L 6 http://localhost:${ port }/${ title } ${ pdfFolder }/${ title }.pdf` );
}

async function generatePdfFiles() {
	const buildFolder = await processor.getBuildFolder();
	const files = await processor.getAllHtmlFiles( buildFolder );
	const titles = files.map( f => path.basename( f, ".html" ) );
	const pdfFolder = path.join( __dirname, "..", "pdf" );
	for( let i = 0; i < titles.length; i++ ) {
		await renderPdf( titles[i], pdfFolder );
	}
}

const server = http.createServer( ( request, response ) => {
	return handler( request, response, {
		public: "build"
	} );
} );

server.listen( port, async () => {
	await generatePdfFiles();
	server.close();
} );
