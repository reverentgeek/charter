import path from "node:path";
import { getBuildFolder, getAllHtmlFiles } from "../src/processor.js";
import { renderPdf } from "../src/pdf.js";

const __dirname = import.meta.url;

( async () => {
	const buildFolder = await getBuildFolder();
	const files = await getAllHtmlFiles( buildFolder );
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
