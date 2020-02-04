"use strict";
const fs = require( "fs" ).promises;
const chordpro = require( "../src/chordpro" );
const html = require( "../src/html" );
let renderedChart;

beforeAll( async () => {
	const file = await fs.readFile( "./tests/test.chordpro", "utf8" );
	const parsed = chordpro.parse( file ); 
	renderedChart = html.renderChart( parsed );
	// console.log( parsed, renderedHtml );
} );

test( "html renders title", () => {
	expect( renderedChart.header ).toEqual( expect.stringContaining( "<h1 class=\"charter-title\">Believer</h1>" ) );
} );

test( "html renders artist", () => {
	expect( renderedChart.header ).toEqual( expect.stringContaining( "<h2 class=\"charter-artist\">Bryan Fowler, Mitch Wong, Rhett Walker</h2>" ) );
} );

test( "html renders subtitle", () => {
	expect( renderedChart.header ).toEqual( expect.stringContaining( "<h2 class=\"charter-subtitle\">(as published by Essential Music Publishing)</h2>" ) );
} );

test( "html renders key", () => {
	expect( renderedChart.header ).toEqual( expect.stringContaining( "<h2 class=\"charter-key\">Key: Eb | Tempo: 87 | Time: 4/4</h2>" ) );
} );

test( "html renders sections", () => {
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<div class=\"charter-section-title\">Verse 1</div>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<div class=\"charter-section-title\">Chorus 1</div>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<td class=\"charter-lyric\">I walk a bit different </td>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<td class=\"charter-comment\">(2nd x to Br.)</td>" ) );
} );
