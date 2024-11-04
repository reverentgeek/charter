/* eslint-disable n/no-extraneous-import */
import handler from "serve-handler";
import path from "node:path";
import http from "node:http";
import { promisify } from "node:util";
import child_process from "node:child_process";
import { getBuildFolder, getAllHtmlFiles } from "../src/processor.js";

const exec = promisify( child_process.exec );
const __dirname = import.meta.url;

const port = 3000;

async function renderPdf( title, pdfFolder ) {
	console.log( `saving ${ title } to pdf...` );
	await exec( `wkhtmltopdf --page-size Letter -T 6 -R 6 -B 6 -L 6 http://localhost:${ port }/${ title } ${ pdfFolder }/${ title }.pdf` );
}

async function generatePdfFiles() {
	const buildFolder = await getBuildFolder();
	const files = await getAllHtmlFiles( buildFolder );
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
