import { describe, it, before } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import * as chordpro from "../src/chordpro.js";
import * as html from "../src/htmlTableFormat.js";

let parsed;
let renderedChart;
let renderedHtml;
let renderedColumnHtml;

describe( "html table tests", () => {

	before( async () => {
		const file = await fs.readFile( "./tests/test.cho", "utf8" );
		parsed = chordpro.parse( file );
		renderedChart = html.renderChart( parsed );
		renderedHtml = await html.render( parsed, { columns: false } );
		renderedColumnHtml = await html.render( parsed, { columns: true } );
	} );

	it( "html renders title", () => {
		assert.ok( renderedChart.header.includes( "<h1 class=\"charter-title\">Amazing Grace</h1>" ) );
	} );

	it( "html renders artist", () => {
		assert.ok( renderedChart.header.includes( "<h2 class=\"charter-artist\">Words by: John Newton, John P. Rees</h2>" ) );
	} );

	it( "html renders subtitle", () => {
		assert.ok( renderedChart.header.includes( "<h2 class=\"charter-subtitle\">Published in 1779</h2>" ) );
	} );

	it( "html renders key", () => {
		assert.ok( renderedChart.header.includes( "<h2 class=\"charter-key\">Key: G | Tempo: 90 | Time: 3/4</h2>" ) );
	} );

	it( "html renders sections", () => {
		assert.ok( renderedChart.body.includes( "<div class=\"charter-section-title\">Verse 1</div>" ) );
		assert.ok( renderedChart.body.includes( "<div class=\"charter-section-title\">Refrain</div>" ) );
		assert.ok( renderedChart.body.includes( "<td class=\"charter-lyric\">And grace my fears re - </td>" ) );
		assert.ok( renderedChart.body.includes( "<td class=\"charter-section-title\">(testing direction)</td>" ) );
	} );

	it( "rendered html includes html template", () => {
		assert.ok( renderedHtml.includes( "<link rel=\"stylesheet\" href=\"./assets/tablestyles.css\">" ) );
	} );

	it( "rendered default html not not include 2-column css", () => {
		assert.ok( !renderedHtml.includes( "./assets/tablestyles-columns.css" ) );
	} );

	it( "rendered column html to include 2-column css", () => {
		assert.ok( renderedColumnHtml.includes( "<link rel=\"stylesheet\" href=\"./assets/tablestyles-columns.css\">" ) );
	} );

	it( "empty chart", () => {
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
		assert.equal( htmlChart.header, "" );
		assert.equal( htmlChart.body, "" );
		assert.equal( htmlChart.footer, "" );
	} );

	it( "chart with only body", () => {
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
		assert.equal( htmlChart.header, "" );
		assert.equal( htmlChart.footer, "" );
		assert.ok( renderedChart.body.includes( "<div class=\"charter-section-title\">Verse 1</div>" ) );
		assert.ok( renderedChart.body.includes( "<div class=\"charter-section-title\">Refrain</div>" ) );
		assert.ok( renderedChart.body.includes( "<td class=\"charter-lyric\">And grace my fears re - </td>" ) );
		assert.ok( renderedChart.body.includes( "<td class=\"charter-section-title\">(testing direction)</td>" ) );
	} );

	describe( "formats chords", () => {
		it( "formats major chords", () => {
			const a = html.formatChord( "A" );
			assert.equal( a, "A" );
			const bflat = html.formatChord( "Bb" );
			assert.equal( bflat, "Bb" );
			const csharp = html.formatChord( "C#" );
			assert.equal( csharp, "C#" );
			const five = html.formatChord( "5" );
			assert.equal( five, "5" );
		} );

		it( "formats flatted and sharped numbers", () => {
			const flatSeven = html.formatChord( "b7" );
			assert.equal( flatSeven, "b7" );
			const sharp5 = html.formatChord( "#5" );
			assert.equal( sharp5, "#5" );
		} );

		it( "formats inverted chords", () => {
			const goverb = html.formatChord( "G/B" );
			assert.equal( goverb, "G/B" );
			const oneover3 = html.formatChord( "1/3" );
			assert.equal( oneover3, "1/3" );
		} );

		it( "formats suspended chords", () => {
			const dsus = html.formatChord( "Dsus" );
			assert.equal( dsus, "D<sup>sus</sup>" );
			const onesus = html.formatChord( "1sus" );
			assert.equal( onesus, "1<sup>sus</sup>" );
		} );

		it( "formats flat 5 chords", () => {
			const dflat5 = html.formatChord( "Db5" );
			assert.equal( dflat5, "Db<sup>5</sup>" );
			const oneflat5 = html.formatChord( "15" );
			assert.equal( oneflat5, "1<sup>5</sup>" );
		} );

		it( "format augmented chords", () => {
			const asharpaug7 = html.formatChord( "A#o7" );
			assert.equal( asharpaug7, "A#<sup>o7</sup>" );
		} );

		it( "format inverted chords with attributes", () => {
			const bsevenoverfsharp = html.formatChord( "B7/F#" );
			assert.equal( bsevenoverfsharp, "B<sup>7</sup>/F#" );
		} );

		it( "format maj chords", () => {
			const fmajseven = html.formatChord( "Fmaj7" );
			assert.equal( fmajseven, "F<sup>maj7</sup>" );
		} );

		it( "does not format non-chords", () => {
			const nc = html.formatChord( "N.C." );
			assert.equal( nc, "N.C." );
			const nc2 = html.formatChord( "RANDOM" );
			assert.equal( nc2, "RANDOM" );
		} );
	} );

} );
