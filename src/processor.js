"use strict";

const chordpro = require( "./chordpro" );
const html = require( "./html" );
const fs = require( "fs-extra" );
const path = require( "path" );

async function saveChordProFileAsHtml( chartFolder, buildFolder, chordFile ) {
	const title = path.basename( chordFile, chordFile.endsWith( ".cho" ) ? ".cho" : ".chordpro" );
	const file = path.join( chartFolder, chordFile );
	const htmlFile = path.join( buildFolder, `${ title }.html` );
	console.log( `Converting ${ chordFile } to html...` );
	const text = await fs.readFile( file, "utf8" );
	const chart = chordpro.parse( text );
	const chartHtml = await html.render( chart, { columns: false } );
	await fs.writeFile( htmlFile, chartHtml, { encoding: "utf8" } );
}

async function getChartFolder( pathToChartFolder ) {
	return pathToChartFolder ? pathToChartFolder : path.join( __dirname, "..", "charts" );
}

async function getBuildFolder( pathToBuildFolder ) {
	return pathToBuildFolder ? pathToBuildFolder : path.join( __dirname, "..", "build" );
}

async function getAllHtmlFiles( buildFolder ) {
	const files = await fs.readdir( buildFolder );
	return files.filter( f => f.endsWith( ".html" ) );
}

async function getAllChordProFiles( chartFolder ) {
	const files = await fs.readdir( chartFolder );
	return files.filter( f => f.endsWith( ".cho" ) || f.endsWith( ".chordpro" ) );
}

async function convertChordProFilesToHtml( pathToChartFolder = "", pathToBuildFolder = "" ) {
	const chartFolder = await getChartFolder( pathToChartFolder );
	const buildFolder = await getBuildFolder( pathToBuildFolder );
	const chordFiles = await getAllChordProFiles( chartFolder );
	for( let i = 0; i < chordFiles.length; i++ ){
		await saveChordProFileAsHtml( chartFolder, buildFolder, chordFiles[i] );
	}
}

module.exports = {
	getAllChordProFiles,
	convertChordProFilesToHtml,
	getAllHtmlFiles,
	getBuildFolder,
	getChartFolder
};
