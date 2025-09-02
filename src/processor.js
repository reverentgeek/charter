import fs from "fs-extra";
import path from "path";
import { parse } from "./chordpro.js";
import { render } from "./html.js";

const __dirname = import.meta.dirname;

async function saveChordProFileAsHtml( chartFolder, buildFolder, chordFile, columns ) {
	const title = path.basename( chordFile, chordFile.endsWith( ".cho" ) ? ".cho" : ".chordpro" );
	const file = path.join( chartFolder, chordFile );
	const htmlFile = path.join( buildFolder, `${ title }.html` );
	console.log( `Converting ${ chordFile } to html...` );
	const text = await fs.readFile( file, "utf8" );
	const chart = parse( text );
	const chartHtml = await render( chart, { columns } );
	await fs.writeFile( htmlFile, chartHtml, { encoding: "utf8" } );
}

export async function getChartFolder( pathToChartFolder ) {
	return pathToChartFolder ? pathToChartFolder : path.join( __dirname, "..", "charts" );
}

export async function getBuildFolder( pathToBuildFolder ) {
	return pathToBuildFolder ? pathToBuildFolder : path.join( __dirname, "..", "build" );
}

export async function getAllHtmlFiles( buildFolder ) {
	const files = await fs.readdir( buildFolder );
	return files.filter( f => f.endsWith( ".html" ) );
}

export async function getAllChordProFiles( chartFolder ) {
	const files = await fs.readdir( chartFolder );
	return files.filter( f => f.endsWith( ".cho" ) || f.endsWith( ".chordpro" ) );
}

export async function convertChordProFilesToHtml( { pathToChartFolder = "", pathToBuildFolder = "", columns = false } ) {
	const chartFolder = await getChartFolder( pathToChartFolder );
	const buildFolder = await getBuildFolder( pathToBuildFolder );
	const chordFiles = await getAllChordProFiles( chartFolder );
	for ( let i = 0; i < chordFiles.length; i++ ) {
		await saveChordProFileAsHtml( chartFolder, buildFolder, chordFiles[i], columns );
	}
}
