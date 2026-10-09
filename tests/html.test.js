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

		it( "formats chords wrapped in grouping parentheses", () => {
			const res = html.formatChord( "(G)" );
			assert.equal( res, "(G)" );
			const res2 = html.formatChord( "(Am7)" );
			assert.equal( res2, "(Am<sup>7</sup>)" );
		} );

		it( "formats inverted chords wrapped in grouping parentheses", () => {
			const res = html.formatChord( "(1/3)" );
			assert.equal( res, "(1/3)" );
			const res2 = html.formatChord( "(G/B)" );
			assert.equal( res2, "(G/B)" );
			const res3 = html.formatChord( "(B7/F#)" );
			assert.equal( res3, "(B<sup>7</sup>/F#)" );
		} );

		it( "formats chords with leading paren only (spanning group)", () => {
			const res = html.formatChord( "(4" );
			assert.equal( res, "(4" );
			const res2 = html.formatChord( "(Dsus" );
			assert.equal( res2, "(D<sup>sus</sup>" );
		} );

		it( "formats chords with trailing paren only (spanning group)", () => {
			const res = html.formatChord( "2m7)" );
			assert.equal( res, "2m<sup>7</sup>)" );
		} );

		it( "preserves quality parentheses mid-chord", () => {
			const res = html.formatChord( "C(add9)" );
			assert.equal( res, "C<sup>(add9)</sup>" );
		} );

		it( "does not format non-chords", () => {
			const nc = html.formatChord( "N.C." );
			assert.equal( nc, "N.C." );
			const nc2 = html.formatChord( "RANDOM" );
			assert.equal( nc2, "RANDOM" );
		} );
	} );

	describe( "render options", () => {
		it( "links the stylesheet by default", () => {
			assert.ok( renderedHtml.includes( "<link rel=\"stylesheet\" href=\"./assets/styles.css\">" ) );
		} );

		it( "inlines css when provided", () => {
			const res = html.render( parsed, { css: "body { color: red; }" } );
			assert.ok( res.includes( "<style>\nbody { color: red; }\n</style>" ) );
			assert.ok( !res.includes( "<link rel=\"stylesheet\"" ) );
		} );

		it( "credits the site in a footer instead of showing the logo", () => {
			assert.ok( renderedHtml.includes( "<div class=\"charter-credit\">Generated by <a href=\"https://charts.reverentgeek.com\">charts.reverentgeek.com</a></div>" ) );
			assert.ok( !renderedHtml.includes( "charter-logo" ) );
		} );

		it( "escapes html in the header", () => {
			const chart = chordpro.parse( "{title: Rock & <Roll>}\n{artist: \"Me\"}" );
			const res = html.render( chart );
			assert.ok( res.includes( "<title>Rock &amp; &lt;Roll&gt;</title>" ) );
			assert.ok( res.includes( "<span class=\"charter-title\">Rock &amp; &lt;Roll&gt;</span>" ) );
			assert.ok( res.includes( "<span class=\"charter-artist\">&#34;Me&#34;</span>" ) );
		} );
	} );

	it( "renders an untitled section without an empty section title", async () => {
		const chart = chordpro.parse( "[G]Line one\nLine two" );
		const res = await html.render( chart );
		assert.ok( res.includes( "Line one" ) );
		assert.ok( !res.includes( "charter-section-title" ) );
	} );

	it( "escapes html in section titles, chords, lyrics, and directions", async () => {
		const chart = chordpro.parse( "{title: A & B}\n{section: <i>Verse</i>}\n[<b>]Tom & <script>x</script> 'Jerry' (go <u>up</u>)" );
		const res = await html.render( chart );
		assert.ok( !res.includes( "<script>" ) );
		assert.ok( !res.includes( "<i>" ) );
		assert.ok( !res.includes( "<b>" ) );
		assert.ok( !res.includes( "<u>" ) );
		assert.ok( res.includes( "A &amp; B" ) );
		assert.ok( res.includes( "&lt;i&gt;Verse&lt;/i&gt;" ) );
		assert.ok( res.includes( "&lt;b&gt;" ) );
		assert.ok( res.includes( "Tom &amp; &lt;script&gt;x&lt;/script&gt; &#39;Jerry&#39;" ) );
		assert.ok( res.includes( "(go &lt;u&gt;up&lt;/u&gt;)" ) );
	} );
} );
