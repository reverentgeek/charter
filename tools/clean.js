import fs from "fs-extra";
import { join } from "node:path";
const __dirname = import.meta.dirname;

( async () => {
	const buildFolder = join( __dirname, "..", "build" );
	const assetFolder = join( __dirname, "..", "src", "assets" );
	const pdfFolder = join( __dirname, "..", "pdf" );
	await fs.emptyDir( pdfFolder );
	await fs.emptyDir( buildFolder );
	await fs.ensureDir( join( buildFolder, "assets" ) );
	await fs.copy( assetFolder, join( buildFolder, "assets" ) );
} )();
