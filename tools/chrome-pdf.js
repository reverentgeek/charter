import path from "node:path";
const __dirname = import.meta.dirname;

import chrome from "../src/chrome.js";
import { getBuildFolder, getAllHtmlFiles } from "../src/processor.js";

const pathToChrome = "/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome";
const { renderPdf } = chrome( pathToChrome );

( async () => {
	const buildFolder = await getBuildFolder();
	const files = await getAllHtmlFiles( buildFolder );
	const pdfFolder = path.join( __dirname, "..", "pdf" );
	for ( let i = 0; i < files.length; i++ ) {
		let src = path.join( buildFolder, files[i] );
		const dstFileName = path.basename( files[i], path.extname( files[i] ) ) + ".pdf";
		let dst = path.join( pdfFolder, dstFileName );
		console.log( `saving chord chart as ${ dstFileName }...` );
		await renderPdf( src, dst );
	}
} )();
