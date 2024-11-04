import fs from "node:fs/promises";
import * as chordpro from "../src/chordpro.js";
import * as html from "../src/html.js";

let parsed;
let renderedHtml;
let renderedColumnHtml;

beforeAll( async () => {
	const file = await fs.readFile( "./tests/test.cho", "utf8" );
	parsed = chordpro.parse( file );
	renderedHtml = await html.render( parsed, { columns: false } );
	renderedColumnHtml = await html.render( parsed, { columns: true } );
} );

test( "rendered html includes html template", () => {
	expect( renderedHtml ).toEqual( expect.stringContaining( "<span class=\"charter-song-header\">" ) );
} );

test( "rendered default html not not include 2-column css", () => {
	expect( renderedHtml ).toEqual( expect.not.stringContaining( "charter-column left-column" ) );
	expect( renderedHtml ).toEqual( expect.not.stringContaining( "charter-column right-column" ) );
} );

test( "rendered column html to include 2-column css", () => {
	expect( renderedColumnHtml ).toEqual( expect.stringContaining( "charter-column left-column" ) );
	expect( renderedColumnHtml ).toEqual( expect.stringContaining( "charter-column right-column" ) );
} );

test ( "calculates the total lines in sections", async () => {
	const text = await fs.readFile( "./tests/test.cho", "utf8" );
	const parsed = chordpro.parse( text );
	expect( html.totalLines( parsed.sections ) ).toEqual( 21 );
	parsed.sections.pop();
	expect( html.totalLines( parsed.sections ) ).toEqual( 20 );
	parsed.sections.pop();
	expect( html.totalLines( parsed.sections ) ).toEqual( 15 );
	parsed.sections.pop();
	expect( html.totalLines( parsed.sections ) ).toEqual( 10 );
	parsed.sections.pop();
	expect( html.totalLines( parsed.sections ) ).toEqual( 5 );
	parsed.sections.pop();
	expect( html.totalLines( parsed.sections ) ).toEqual( 0 );
} );

test ( "calculates the column break point", async () => {
	const text = await fs.readFile( "./tests/test.cho", "utf8" );
	const parsed = chordpro.parse( text );
	expect( html.getColumnBreak( parsed.sections ) ).toEqual( 3 );
	parsed.sections.pop();
	expect( html.getColumnBreak( parsed.sections ) ).toEqual( 2 );
	parsed.sections.pop();
	expect( html.getColumnBreak( parsed.sections ) ).toEqual( 2 );
	parsed.sections.pop();
	expect( html.getColumnBreak( parsed.sections ) ).toEqual( 1 );
	parsed.sections.pop();
	expect( html.getColumnBreak( parsed.sections ) ).toEqual( 0 );
} );
