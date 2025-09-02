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

		it( "formats minor chords", () => {
			const a = html.formatChord( "Am" );
			assert.equal( a, "Am" );
			const bflat = html.formatChord( "Bbm" );
			assert.equal( bflat, "Bbm" );
			const csharp = html.formatChord( "C#m" );
			assert.equal( csharp, "C#m" );
			const five = html.formatChord( "5m" );
			assert.equal( five, "5m" );
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
			assert.equal( fmajseven, "Fmaj<sup>7</sup>" );
		} );

		it( "does not format non-chords", () => {
			const nc = html.formatChord( "N.C." );
			assert.equal( nc, "N.C." );
			const nc2 = html.formatChord( "RANDOM" );
			assert.equal( nc2, "RANDOM" );
		} );
	} );
} );
