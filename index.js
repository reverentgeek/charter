"use strict";

const chordpro = require( "chordprojs" );
const fs = require( "fs" ).promises;
const path = require( "path" );
const hb = require( "handlebars" );
const handler = require( "serve-handler" );
const http = require( "http" );
const util = require( "util" );
const exec = util.promisify( require( "child_process" ).exec );
const port = 3000;

async function renderPdf( port, name ) {
	const { stderr } = await exec( `wkhtmltopdf http://localhost:${ port }/charts/${ name } ./charts/${ name }.pdf` );
	if ( stderr ) {
		console.log( stderr );
	}
}

async function getChartTemplate() {
	const text = await fs.readFile( path.join( __dirname, "chart.hbs" ), "utf8" );
	const template = hb.compile( text );
	return template;
}

async function parseChordFile( template, chordFile, htmlFile ) {
	const text = await fs.readFile( chordFile, "utf8" );
	const song = chordpro.parse( text );
	const chart = song.render();
	const html = template( { body: chart } );
	await fs.writeFile( htmlFile, html, { encoding: "utf8" } );
}

async function renderChart( chordFile, chartFolder, template ) {
	const fileName = path.basename( chordFile, chordFile.endsWith( ".cho" ) ? ".cho" : ".chordpro" );
	const filePath = path.join( chartFolder, chordFile );
	const newFile = path.join( chartFolder, `${ fileName }.html` );
	console.log( filePath );
	console.log( newFile );
	await parseChordFile( template, filePath, newFile );
	await renderPdf( port, fileName );
}

async function renderCharts() {
	const template = await getChartTemplate();
	const chartFolder = path.join( __dirname, "charts" );
	const files = await fs.readdir( chartFolder );
	const chordFiles = files.filter( f => f.endsWith( ".cho" ) || f.endsWith( ".chordpro" ) );
	for( let i = 0; i < chordFiles.length; i++ ){
		await renderChart( chordFiles[i], chartFolder, template );
	}
}

const server = http.createServer( ( request, response ) => {
	// You pass two more arguments for config and middleware
	// More details here: https://github.com/zeit/serve-handler#options
	return handler( request, response );
} );

server.listen( 3000, async () => {
	await renderCharts();
	server.close();
	console.log( "finished" );
} );
