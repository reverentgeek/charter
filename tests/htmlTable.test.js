import fs from "node:fs/promises";
import * as chordpro from "../src/chordpro.js";
import * as html from "../src/htmlTableFormat.js";

let parsed;
let renderedChart;
let renderedHtml;
let renderedColumnHtml;

beforeAll( async () => {
	const file = await fs.readFile( "./tests/test.cho", "utf8" );
	parsed = chordpro.parse( file );
	renderedChart = html.renderChart( parsed );
	renderedHtml = await html.render( parsed, { columns: false } );
	renderedColumnHtml = await html.render( parsed, { columns: true } );
} );

test( "html renders title", () => {
	expect( renderedChart.header ).toEqual( expect.stringContaining( "<h1 class=\"charter-title\">Amazing Grace</h1>" ) );
} );

test( "html renders artist", () => {
	expect( renderedChart.header ).toEqual( expect.stringContaining( "<h2 class=\"charter-artist\">Words by: John Newton, John P. Rees</h2>" ) );
} );

test( "html renders subtitle", () => {
	expect( renderedChart.header ).toEqual( expect.stringContaining( "<h2 class=\"charter-subtitle\">Published in 1779</h2>" ) );
} );

test( "html renders key", () => {
	expect( renderedChart.header ).toEqual( expect.stringContaining( "<h2 class=\"charter-key\">Key: G | Tempo: 90 | Time: 3/4</h2>" ) );
} );

test( "html renders sections", () => {
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<div class=\"charter-section-title\">Verse 1</div>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<div class=\"charter-section-title\">Refrain</div>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<td class=\"charter-lyric\">And grace my fears re - </td>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<td class=\"charter-section-title\">(testing direction)</td>" ) );
} );

test( "rendered html includes html template", () => {
	expect( renderedHtml ).toEqual( expect.stringContaining( "<link rel=\"stylesheet\" href=\"./assets/tablestyles.css\">" ) );
} );

test( "rendered default html not not include 2-column css", () => {
	expect( renderedHtml ).toEqual( expect.not.stringContaining( "./assets/tablestyles-columns.css" ) );
} );

test( "rendered column html to include 2-column css", () => {
	expect( renderedColumnHtml ).toEqual( expect.stringContaining( "<link rel=\"stylesheet\" href=\"./assets/tablestyles-columns.css\">" ) );
} );

test( "empty chart", () => {
	const chart = {
		title: "",
		subtitle: "",
		artist: [],
		key: "",
		tempo: "",
		time: "",
		sections: [],
		footer: []
	};
	const htmlChart = html.renderChart( chart );
	expect( htmlChart.header ).toEqual( "" );
	expect( htmlChart.body ).toEqual( "" );
	expect( htmlChart.footer ).toEqual( "" );
} );

test( "chart with only body", () => {
	const chart = {
		title: "",
		subtitle: "",
		artist: [],
		key: "",
		tempo: "",
		time: "",
		sections: [],
		footer: []
	};
	chart.sections = parsed.sections;
	const htmlChart = html.renderChart( chart );
	expect( htmlChart.header ).toEqual( "" );
	expect( htmlChart.footer ).toEqual( "" );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<div class=\"charter-section-title\">Verse 1</div>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<div class=\"charter-section-title\">Refrain</div>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<td class=\"charter-lyric\">And grace my fears re - </td>" ) );
	expect( renderedChart.body ).toEqual( expect.stringContaining( "<td class=\"charter-section-title\">(testing direction)</td>" ) );
} );

describe( "formats chords", () => {
	test( "formats major chords", () => {
		const a = html.formatChord( "A" );
		expect( a ).toBe( "A" );
		const bflat = html.formatChord( "Bb" );
		expect( bflat ).toBe( "Bb" );
		const csharp = html.formatChord( "C#" );
		expect( csharp ).toBe( "C#" );
		const five = html.formatChord( "5" );
		expect( five ).toBe( "5" );
	} );

	test( "formats flatted and sharped numbers", () => {
		const flatSeven = html.formatChord( "b7" );
		expect( flatSeven ).toBe( "b7" );
		const sharp5 = html.formatChord( "#5" );
		expect( sharp5 ).toBe( "#5" );
	} );

	test( "formats inverted chords", () => {
		const goverb = html.formatChord( "G/B" );
		expect( goverb ).toBe( "G/B" );
		const oneover3 = html.formatChord( "1/3" );
		expect( oneover3 ).toBe( "1/3" );
	} );

	test( "formats suspended chords", () => {
		const dsus = html.formatChord( "Dsus" );
		expect( dsus ).toBe( "Dsus" );
		const onesus = html.formatChord( "1sus" );
		expect( onesus ).toBe( "1sus" );
	} );

	test( "formats flat 5 chords", () => {
		const dflat5 = html.formatChord( "D5b" );
		expect( dflat5 ).toBe( "D<sup>5b</sup>" );
		const oneflat5 = html.formatChord( "15b" );
		expect( oneflat5 ).toBe( "1<sup>5b</sup>" );
	} );

	test( "format augmented chords", () => {
		const asharpaug7 = html.formatChord( "A#o7" );
		expect( asharpaug7 ).toBe( "A#<sup>o7</sup>" );
	} );

	test( "format inverted chords with attributes", () => {
		const bsevenoverfsharp = html.formatChord( "B7/F#" );
		expect( bsevenoverfsharp ).toBe( "B<sup>7</sup>/F#" );
	} );

	test( "format maj chords", () => {
		const fmajseven = html.formatChord( "Fmaj7" );
		expect( fmajseven ).toBe( "Fmaj<sup>7</sup>" );
	} );
} );
