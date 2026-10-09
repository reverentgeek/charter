import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import { parse } from "../src/chordpro.js";
import { setMetadata, metadataFields } from "../src/metadata.js";

const chart = `{title: Old Title}
{artist: First}
{key: G}

{section: Verse 1}
[G]Line one`;

describe( "metadata tests", () => {
	it( "replaces an existing value", () => {
		const res = setMetadata( chart, "title", "New Title" );
		assert.equal( res, chart.replace( "{title: Old Title}", "{title: New Title}" ) );
	} );

	it( "leaves the text untouched when the value is unchanged", () => {
		const text = "{Title:Same}\n{section: A}\nline";
		assert.equal( setMetadata( text, "title", "Same" ), text );
		assert.equal( setMetadata( text, "title", " Same " ), text );
	} );

	it( "removes the directive when the value is empty", () => {
		const res = setMetadata( chart, "key", "" );
		assert.equal( res, chart.replace( "{key: G}\n", "" ) );
		assert.equal( parse( res ).key, "" );
	} );

	it( "adds a missing field in the usual order", () => {
		const withSubtitle = setMetadata( chart, "subtitle", "Sub" );
		assert.equal( withSubtitle, chart.replace( "{title: Old Title}\n", "{title: Old Title}\n{subtitle: Sub}\n" ) );
		const withTime = setMetadata( chart, "time", "4/4" );
		assert.equal( withTime, chart.replace( "{key: G}\n", "{key: G}\n{time: 4/4}\n" ) );
		const withTempo = setMetadata( withTime, "tempo", "90" );
		assert.equal( withTempo, chart.replace( "{key: G}\n", "{key: G}\n{tempo: 90}\n{time: 4/4}\n" ) );
	} );

	it( "adds a field before later fields when nothing precedes it", () => {
		const res = setMetadata( "{key: G}\n{section: A}\nline", "title", "T" );
		assert.equal( res, "{title: T}\n{key: G}\n{section: A}\nline" );
	} );

	it( "adds metadata to text that has none", () => {
		assert.equal( setMetadata( "", "title", "T" ), "{title: T}\n" );
		assert.equal( setMetadata( "[G]Line one\nLine two", "title", "T" ), "{title: T}\n\n[G]Line one\nLine two" );
		assert.equal( setMetadata( "\nVERSE 1\nline", "key", "A" ), "{key: A}\n\nVERSE 1\nline" );
	} );

	it( "changes the last of a repeated directive, which is the one the parser uses", () => {
		const res = setMetadata( "{title: One}\n{title: Two}", "title", "Three" );
		assert.equal( res, "{title: One}\n{title: Three}" );
		assert.equal( parse( res ).title, "Three" );
		assert.equal( setMetadata( "{title: One}\n{title: Two}", "title", "" ), "" );
	} );

	it( "updates, adds, and removes artist lines", () => {
		const text = "{title: T}\n{artist: A}\n{composer: B}\n{key: G}";
		assert.equal( setMetadata( text, "artist", "A\nC" ), "{title: T}\n{artist: A}\n{composer: C}\n{key: G}" );
		assert.equal( setMetadata( text, "artist", "A\nB\nD\n" ), "{title: T}\n{artist: A}\n{composer: B}\n{artist: D}\n{key: G}" );
		assert.equal( setMetadata( text, "artist", "A" ), "{title: T}\n{artist: A}\n{key: G}" );
		assert.equal( setMetadata( text, "artist", "\n" ), "{title: T}\n{key: G}" );
		assert.deepEqual( parse( setMetadata( text, "artist", "X\n\n Y \nZ" ) ).artist, [ "X", "Y", "Z" ] );
	} );

	it( "keeps windows line endings", () => {
		const text = "{title: T}\r\n{section: A}\r\nline";
		assert.equal( setMetadata( text, "title", "New" ), "{title: New}\r\n{section: A}\r\nline" );
		assert.equal( setMetadata( text, "key", "G" ), "{title: T}\r\n{key: G}\r\n{section: A}\r\nline" );
	} );

	it( "ignores directives in the CCLI footer", () => {
		const text = "{section: A}\nline\nCCLI Song # 1\n{title: Not A Title}";
		const res = setMetadata( text, "title", "Real" );
		assert.equal( res, "{title: Real}\n\n{section: A}\nline\nCCLI Song # 1\n{title: Not A Title}" );
		assert.equal( parse( res ).title, "Real" );
	} );

	it( "round-trips every field through the parser", async () => {
		const file = await fs.readFile( "./tests/test.cho", "utf8" );
		for ( const text of [ "", "[G]Line one", chart, file ] ) {
			let res = text;
			for ( const field of metadataFields ) {
				res = setMetadata( res, field, field === "artist" ? "Name One\nName Two" : `new ${ field }` );
			}
			const parsed = parse( res );
			assert.equal( parsed.title, "new title" );
			assert.equal( parsed.subtitle, "new subtitle" );
			assert.deepEqual( parsed.artist, [ "Name One", "Name Two" ] );
			assert.equal( parsed.key, "new key" );
			assert.equal( parsed.tempo, "new tempo" );
			assert.equal( parsed.time, "new time" );
			assert.deepEqual( parsed.sections, parse( text ).sections );
		}
	} );
} );
