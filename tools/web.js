import fs from "node:fs/promises";
import { join } from "node:path";
import { compileAsync } from "sass";
const __dirname = import.meta.dirname;

const root = join( __dirname, ".." );
const distFolder = join( root, "dist" );

await fs.rm( distFolder, { recursive: true, force: true } );
await fs.cp( join( root, "web" ), distFolder, { recursive: true } );

// The page imports these straight from src/; none of them has any outside dependencies.
await fs.mkdir( join( distFolder, "lib" ) );
for ( const file of [ "chordpro.js", "html.js", "metadata.js" ] ) {
	await fs.copyFile( join( root, "src", file ), join( distFolder, "lib", file ) );
}

await fs.mkdir( join( distFolder, "assets" ) );
const css = await compileAsync( join( root, "src", "sass", "styles.scss" ) );
await fs.writeFile( join( distFolder, "assets", "styles.css" ), css.css, "utf-8" );
await fs.copyFile( join( root, "src", "assets", "logo.jpg" ), join( distFolder, "assets", "logo.jpg" ) );

await fs.copyFile( join( root, "tests", "test.cho" ), join( distFolder, "sample.cho" ) );

console.log( "built web app in dist/" );
