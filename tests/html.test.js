import { describe, it, before } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import * as chordpro from "../src/chordpro.js";
import * as html from "../src/html.js";

let parsed;
let renderedHtml;
let renderedColumnHtml;

describe( "html tests", () => {

	before( async () => {
		const file = await fs.readFile( "./tests/test.cho", "utf8" );
		parsed = chordpro.parse( file );
		renderedHtml = await html.render( parsed, { columns: false } );
		renderedColumnHtml = await html.render( parsed, { columns: true } );
	} );

	it( "rendered html includes html template", () => {
		assert.ok( renderedHtml.includes( "<span class=\"charter-song-header\">" ) );
	} );

	it( "rendered default html not not include 2-column css", () => {
		assert.ok( !renderedHtml.includes( "charter-column left-column" ) );
		assert.ok( !renderedHtml.includes( "charter-column right-column" ) );
	} );

	it( "rendered column html to include 2-column css", () => {
		assert.ok( renderedColumnHtml.includes( "charter-column left-column" ) );
		assert.ok( renderedColumnHtml.includes( "charter-column right-column" ) );
	} );

	it( "calculates the total lines in sections", async () => {
		const text = await fs.readFile( "./tests/test.cho", "utf8" );
		const parsed = chordpro.parse( text );
		assert.equal( html.totalLines( parsed.sections ), 21 );
		parsed.sections.pop();
		assert.equal( html.totalLines( parsed.sections ), 20 );
		parsed.sections.pop();
		assert.equal( html.totalLines( parsed.sections ), 15 );
		parsed.sections.pop();
		assert.equal( html.totalLines( parsed.sections ), 10 );
		parsed.sections.pop();
		assert.equal( html.totalLines( parsed.sections ), 5 );
		parsed.sections.pop();
		assert.equal( html.totalLines( parsed.sections ), 0 );
	} );

	it( "calculates the column break point", async () => {
		const text = await fs.readFile( "./tests/test.cho", "utf8" );
		const parsed = chordpro.parse( text );
		assert.equal( html.getColumnBreak( parsed.sections ), 3 );
		parsed.sections.pop();
		assert.equal( html.getColumnBreak( parsed.sections ), 2 );
		parsed.sections.pop();
		assert.equal( html.getColumnBreak( parsed.sections ), 2 );
		parsed.sections.pop();
		assert.equal( html.getColumnBreak( parsed.sections ), 1 );
		parsed.sections.pop();
		assert.equal( html.getColumnBreak( parsed.sections ), 0 );
	} );

} );
