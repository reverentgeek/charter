import fs from "fs-extra";
import { join, parse } from "node:path";
import { compileAsync } from "sass";
const __dirname = import.meta.dirname;

const buildFolder = join( __dirname, "..", "build", "assets" );
const srcFolder = join( __dirname, "..", "src", "sass" );

const files = await fs.readdir( srcFolder );

for ( const file of files ) {
	const parsed = parse( file );
	if ( parsed.ext === ".scss" ) {
		const css = await compileAsync( join( srcFolder, file ) );
		const destFile = join( buildFolder, parsed.name + ".css" );
		await fs.writeFile( destFile, css.css, "utf-8" );
	}
}
