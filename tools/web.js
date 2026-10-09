import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { join, relative } from "node:path";
import { compileAsync } from "sass";
const __dirname = import.meta.dirname;

const root = join( __dirname, ".." );
const distFolder = join( root, "dist" );

await fs.rm( distFolder, { recursive: true, force: true } );
await fs.cp( join( root, "web" ), distFolder, { recursive: true } );

// The page imports these from src/; none of them has any outside dependencies.
await fs.mkdir( join( distFolder, "lib" ) );
for ( const file of [ "chordpro.js", "html.js", "metadata.js", "chordsOverText.js" ] ) {
	await fs.copyFile( join( root, "src", file ), join( distFolder, "lib", file ) );
}

await fs.mkdir( join( distFolder, "assets" ) );
const css = await compileAsync( join( root, "src", "sass", "styles.scss" ) );
await fs.writeFile( join( distFolder, "assets", "styles.css" ), css.css, "utf-8" );

await fs.copyFile( join( root, "tests", "test.cho" ), join( distFolder, "sample.cho" ) );

// GitHub Pages lets browsers reuse every file for ten minutes, so a deploy could pair the new page with a
// stale stylesheet or script. Stamping each relative URL with a hash of the build makes them change together.
const files = ( await fs.readdir( distFolder, { recursive: true, withFileTypes: true } ) )
	.filter( entry => entry.isFile() )
	.map( entry => join( entry.parentPath, entry.name ) )
	.sort();
const hash = createHash( "sha256" );
for ( const file of files ) {
	hash.update( relative( distFolder, file ) ).update( await fs.readFile( file ) );
}
const version = hash.digest( "hex" ).slice( 0, 8 );
for ( const file of files.filter( f => /\.(html|js)$/.test( f ) ) ) {
	const text = await fs.readFile( file, "utf-8" );
	await fs.writeFile( file, text.replace( /\.\/[\w/-]+\.(?:js|css|jpg|png|cho)\b/g, url => `${ url }?v=${ version }` ), "utf-8" );
}

console.log( `built web app in dist/ (${ version })` );
