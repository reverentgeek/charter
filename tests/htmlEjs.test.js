"use strict";
const fs = require( "fs-extra" );
const chordpro = require( "../src/chordpro" );
const html = require( "../src/htmlFromEjs" );
let parsed;
let renderedHtml;
let renderedColumnHtml;

beforeAll( async () => {
	const file = await fs.readFile( "./tests/test.cho", "utf8" );
	parsed = chordpro.parse( file );
	renderedHtml = await html.render( parsed, { columns: false } );
	renderedColumnHtml = await html.render( parsed, { columns: true } );
	await fs.writeFile( "./tests/test.html", renderedHtml );
} );

test( "rendered html includes html template", () => {
	expect( renderedHtml ).toEqual( expect.stringContaining( "<link rel=\"stylesheet\" href=\"./assets/styles.css\">" ) );
} );

test( "rendered default html not not include 2-column css", () => {
	expect( renderedHtml ).toEqual( expect.not.stringContaining( "./assets/2column.css" ) );
} );

test( "rendered column html to include 2-column css", () => {
	expect( renderedColumnHtml ).toEqual( expect.stringContaining( "<link rel=\"stylesheet\" href=\"./assets/2column.css\">" ) );
} );

