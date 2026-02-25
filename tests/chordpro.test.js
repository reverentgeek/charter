import { describe, it } from "node:test";
import assert from "node:assert";
import * as chordpro from "../src/chordpro.js";
import fs from "node:fs/promises";

describe( "chordpro tests", () => {
	it( "parses a line of chordpro text", () => {
		const res = chordpro.parseLyricLine( "Give me [A]eyes to see [E]more of who you [B]are" );
		assert.equal( res.chords.length, res.lyrics.length );
		assert.deepEqual( res, {
			chords: [ "", "A", "E", "B" ],
			lyrics: [ "Give me ", "eyes to see ", "more of who you ", "are" ],
			directions: [ "", "", "", "" ]
		} );
	} );

	it( "parses a line of chordpro text ending with a chord", () => {
		const res = chordpro.parseLyricLine( "Give me [A]eyes to see [E]more of who you are[B]" );
		assert.equal( res.chords.length, res.lyrics.length );
		assert.deepEqual( res, {
			chords: [ "", "A", "E", "B" ],
			lyrics: [ "Give me ", "eyes to see ", "more of who you are", "" ],
			directions: [ "", "", "", "" ]
		} );
	} );

	it( "parses a line of chordpro text with sharp/minor", () => {
		const res = chordpro.parseLyricLine( "There is [A]nothing that could [E]ever sepa - [B]rate us from Your [C#m]love" );
		assert.equal( res.chords.length, res.lyrics.length );
		assert.deepEqual( res, {
			chords: [ "", "A", "E", "B", "C#m" ],
			lyrics: [ "There is ", "nothing that could ", "ever sepa - ", "rate us from Your ", "love" ],
			directions: [ "", "", "", "", "" ]
		} );
	} );

	it( "parses a line of embedded chord chordpro text", () => {
		const res = chordpro.parseLyricLine( "There is no[A]thing that could [E]ever" );
		assert.equal( res.chords.length, res.lyrics.length );
		assert.deepEqual( res, {
			chords: [ "", "A", "E" ],
			lyrics: [ "There is no", "thing that could ", "ever" ],
			directions: [ "", "", "" ]
		} );
	} );

	it( "parses a line with comments", () => {
		const res = chordpro.parseLyricLine( "I am a believer  [Ab]    [Eb]    [Cm]    [Bb] (2nd x to Br.)" );
		assert.equal( res.chords.length, res.lyrics.length );
		assert.deepEqual( res, {
			chords: [ "", "Ab", "Eb", "Cm", "Bb", "" ],
			lyrics: [ "I am a believer  ", "    ", "    ", "    ", " ", "" ],
			directions: [ "", "", "", "", "", "(2nd x to Br.)" ]
		} );
	} );

	it( "parses a line of just chords (e.g. intro/turnaround)", () => {
		const res = chordpro.parseLyricLine( "[|] [A]            [|] [B]            [|] [A]            [|] [B]            [|] " );
		assert.equal( res.chords.length, res.lyrics.length );
		assert.deepEqual( res, {
			chords: [ "|", "A", "|", "B", "|", "A", "|", "B", "|" ],
			lyrics: [ " ", "            ", " ", "            ", " ", "            ", " ", "            ", " " ],
			directions: [ "", "", "", "", "", "", "", "", "" ]
		} );
	} );

	it( "parses a line with chords ahead of lyrics", () => {
		const res = chordpro.parseLyricLine( "[Ab] I hold my [Eb]head a bit higher, [Bb] I lift my [Cm]voice a bit louder" );
		assert.equal( res.chords.length, res.lyrics.length );
		assert.deepEqual( res, {
			chords: [ "Ab", "Eb", "Bb", "Cm" ],
			lyrics: [ " I hold my ", "head a bit higher, ", " I lift my ", "voice a bit louder" ],
			directions: [ "", "", "", "" ]
		} );
	} );

	it( "parses a line with a comment at the end", () => {
		const res = chordpro.parseLyricLine( "I [6m]walk with the king of [5]victory (REPEAT)" );
		assert.equal( res.chords.length, res.lyrics.length );
		assert.deepEqual( res, {
			chords: [ "", "6m", "5", "" ],
			lyrics: [ "I ", "walk with the king of ", "victory ", "" ],
			directions: [ "", "", "", "(REPEAT)" ]
		} );
	} );

	it( "parses a title section", () => {
		const res = chordpro.parseSection( "{title: This is a Title}" );
		assert.deepEqual( res, { type: "title", text: "This is a Title" } );
	} );

	it( "parses a title section, various case", () => {
		const res = chordpro.parseSection( "{TITLE: This is a Title}" );
		assert.deepEqual( res, { type: "title", text: "This is a Title" } );
	} );

	it( "parses artist section with random spaces", () => {
		const res = chordpro.parseSection( "{ artist:  John Smith }" );
		assert.deepEqual( res, { type: "artist", text: "John Smith" } );
	} );

	it( "parses artist section with embedded colons spaces", () => {
		const res = chordpro.parseSection( "{ artist:  Music by: John Smith }" );
		assert.deepEqual( res, { type: "artist", text: "Music by: John Smith" } );
	} );

	it( "parses key section", () => {
		const res = chordpro.parseSection( "{key: A}" );
		assert.deepEqual( res, { type: "key", text: "A" } );
	} );

	it( "parses time section", () => {
		const res = chordpro.parseSection( "{time: 3/4}" );
		assert.deepEqual( res, { type: "time", text: "3/4" } );
	} );

	it( "parses tempo section", () => {
		const res = chordpro.parseSection( "{tempo: 120}" );
		assert.deepEqual( res, { type: "tempo", text: "120" } );
	} );

	it( "parses verse section", () => {
		const res = chordpro.parseSection( "{comment:verse 1}" );
		assert.deepEqual( res, { type: "comment", text: "verse 1" } );
	} );

	it( "parses chorus section", () => {
		const res = chordpro.parseSection( "{comment:chorus}" );
		assert.deepEqual( res, { type: "comment", text: "chorus" } );
	} );

	it( "parses unknown section as comment", () => {
		const res = chordpro.parseSection( "{weird}" );
		assert.deepEqual( res, { type: "weird", text: "weird" } );
	} );

	it( "parses unknown section as comment", () => {
		const res = chordpro.parseSection( "{weird:weird-stuff}" );
		assert.deepEqual( res, { type: "weird", text: "weird-stuff" } );
	} );

	it( "parses entire chordpro file", async () => {
		const text = await fs.readFile( "./tests/test.cho", "utf8" );
		const res = chordpro.parse( text );
		assert.equal( res.title, "Amazing Grace" );
		assert.equal( res.subtitle, "Published in 1779" );
		assert.deepEqual( res.artist, [ "Words by: John Newton, John P. Rees", "Music by: William W. Walker, Edwin Othello Excell" ] );
		assert.equal( res.key, "G" );
		assert.equal( res.tempo, "90" );
		assert.equal( res.time, "3/4" );
		assert.equal( res.sections.length, 5 );
		assert.equal( res.sections[0].title, "Refrain" );
		assert.equal( res.sections[1].title, "Verse 1" );
		assert.equal( res.sections[0].chords.length, 4 );
		assert.equal( res.sections[0].lyrics.length, 4 );
		assert.equal( res.sections[1].chords.length, 4 );
		assert.equal( res.sections[1].lyrics.length, 4 );
		assert.deepEqual( res.sections[0].chords[0], [ "", "G", "G7", "C", "G" ] );
		assert.deepEqual( res.sections[0].lyrics[0], [ "A - ", "mazing ", "Grace! How ", "sweet the ", "sound" ] );
		assert.equal( res.footer.length, 2 );
	} );

	it( "parses a chord followed by a space then lyrics", () => {
		const res = chordpro.parseLyricLine( "[G] amazing grace" );
		assert.deepEqual( res, {
			chords: [ "G" ],
			lyrics: [ " amazing grace" ],
			directions: [ "" ]
		} );
	} );

	it( "parses chord-space-lyrics without swallowing whitespace into chord-only chunk", () => {
		const res = chordpro.parseLyricLine( "[C] I once was lost [G] but now am found" );
		assert.deepEqual( res, {
			chords: [ "C", "G" ],
			lyrics: [ " I once was lost ", " but now am found" ],
			directions: [ "", "" ]
		} );
	} );

	it( "parses standalone chords separated by whitespace (no lyrics)", () => {
		const res = chordpro.parseLyricLine( "[C]   [G]   [Am]" );
		assert.deepEqual( res, {
			chords: [ "C", "G", "Am" ],
			lyrics: [ "   ", "   ", "" ],
			directions: [ "", "", "" ]
		} );
	} );

	it( "parses chords at end of line with trailing whitespace", () => {
		const res = chordpro.parseLyricLine( "[C]word [G]   " );
		assert.deepEqual( res, {
			chords: [ "C", "G" ],
			lyrics: [ "word ", "   " ],
			directions: [ "", "" ]
		} );
	} );

	it( "parses a single line chordpro file", async () => {
		const res = chordpro.parse( `{comment: Verse 1}
[1]A very [4]short [5]song` );
		assert.equal( res.title, "" );
		assert.equal( res.subtitle, "" );
		assert.deepEqual( res.artist, [] );
		assert.equal( res.key, "" );
		assert.equal( res.tempo, "" );
		assert.equal( res.time, "" );
		assert.equal( res.sections.length, 1 );
		assert.equal( res.sections[0].title, "Verse 1" );
		assert.equal( res.sections[0].chords.length, 1 );
		assert.equal( res.sections[0].lyrics.length, 1 );
		assert.deepEqual( res.sections[0].chords[0], [ "1", "4", "5" ] );
		assert.deepEqual( res.sections[0].lyrics[0], [ "A very ", "short ", "song" ] );
		assert.equal( res.footer.length, 0 );
	} );

	it( "detects bare VERSE 1 header as a section", () => {
		assert.equal( chordpro.isBareSection( "VERSE 1" ), true );
	} );

	it( "detects bare PRE-CHORUS header (hyphenated)", () => {
		assert.equal( chordpro.isBareSection( "PRE-CHORUS" ), true );
	} );

	it( "detects bare BRIDGE 1A header (alphanumeric suffix)", () => {
		assert.equal( chordpro.isBareSection( "BRIDGE 1A" ), true );
	} );

	it( "detects bare section headers case-insensitively", () => {
		assert.equal( chordpro.isBareSection( "Verse 1" ), true );
		assert.equal( chordpro.isBareSection( "chorus" ), true );
		assert.equal( chordpro.isBareSection( "Bridge" ), true );
	} );

	it( "does not treat regular lyrics as bare section headers", () => {
		assert.equal( chordpro.isBareSection( "Amazing Grace how sweet the sound" ), false );
		assert.equal( chordpro.isBareSection( "HALLELUJAH PRAISE THE LORD" ), false );
		assert.equal( chordpro.isBareSection( "" ), false );
	} );

	it( "parses a chart with bare section headers", () => {
		const res = chordpro.parse( `{title: Test Song}
{key: G}

VERSE 1

[G]Amazing [C]grace how [G]sweet the sound
[G]That saved a [D]wretch like [G]me

CHORUS

[C]I once was [G]lost but [D]now am [G]found` );
		assert.equal( res.title, "Test Song" );
		assert.equal( res.key, "G" );
		assert.equal( res.sections.length, 2 );
		assert.equal( res.sections[0].title, "VERSE 1" );
		assert.equal( res.sections[0].lyrics.length, 2 );
		assert.equal( res.sections[1].title, "CHORUS" );
		assert.equal( res.sections[1].lyrics.length, 1 );
	} );

	it( "skips PAGE_BREAK lines", () => {
		const res = chordpro.parse( `{comment: Verse 1}
[G]Line one

PAGE_BREAK

{comment: Chorus}
[C]Line two` );
		assert.equal( res.sections.length, 2 );
		assert.equal( res.sections[0].lyrics.length, 1 );
		assert.equal( res.sections[1].lyrics.length, 1 );
	} );
} );
