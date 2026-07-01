import fs from "node:fs/promises";
import { join } from "node:path";
const __dirname = import.meta.dirname;

async function emptyDir( dir ) {
	await fs.rm( dir, { recursive: true, force: true } );
	await fs.mkdir( dir, { recursive: true } );
}

( async () => {
	const buildFolder = join( __dirname, "..", "build" );
	const assetFolder = join( __dirname, "..", "src", "assets" );
	const pdfFolder = join( __dirname, "..", "pdf" );
	await emptyDir( pdfFolder );
	await emptyDir( buildFolder );
	await fs.mkdir( join( buildFolder, "assets" ), { recursive: true } );
	await fs.cp( assetFolder, join( buildFolder, "assets" ), { recursive: true } );
} )();
