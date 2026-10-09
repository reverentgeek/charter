import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import { parse } from "../src/chordpro.js";
import { isChordLine, isChordsOverText, toChordPro } from "../src/chordsOverText.js";

const song = `[Verse]
    F#m                                A
The drinking dens are spilling out and staggering in the square,
D                            A/C#           E
 Everybody's looking for somebody's arms to fall into`;

describe( "chords over text tests", () => {
	it( "recognizes chord lines", () => {
		assert.ok( isChordLine( "    F#m                                A" ) );
		assert.ok( isChordLine( "| F#m | D E | F#m | D E |" ) );
		assert.ok( isChordLine( "Cmaj7  G7sus4  Bb/D  A7(b9)  N.C.  x2" ) );
		assert.ok( !isChordLine( "The drinking dens are spilling out" ) );
		assert.ok( !isChordLine( "A day in the life" ) );
		assert.ok( !isChordLine( "                    1 + 2 +" ) );
		assert.ok( !isChordLine( "| | |" ) );
		assert.ok( !isChordLine( "" ) );
	} );

	it( "detects chords over text", () => {
		assert.ok( isChordsOverText( song ) );
		assert.ok( isChordsOverText( song.replaceAll( "\n", "\r\n" ) ) );
	} );

	it( "does not detect chordpro or plain text", async () => {
		assert.ok( !isChordsOverText( await fs.readFile( "./tests/test.cho", "utf-8" ) ) );
		assert.ok( !isChordsOverText( "VERSE\nGive me [A]eyes to see [E]more\n[A] [E]\nA\nE" ) );
		assert.ok( !isChordsOverText( `{title: Song}\n${ song }` ) );
		assert.ok( !isChordsOverText( "Just some words\nA\nand more words" ) );
		assert.ok( !isChordsOverText( "" ) );
	} );

	it( "puts chords into the lyric at their column", () => {
		assert.equal( toChordPro( song ), [
			"{section: Verse}",
			"The [F#m]drinking dens are spilling out and [A]staggering in the square,",
			"[D] Everybody's looking for some[A/C#]body's arms to [E]fall into"
		].join( "\n" ) );
	} );

	it( "trails chords that sit past the end of the lyric", () => {
		const res = toChordPro( "     F#m        | D E |\nIt's what it is\n               F#m        | D E |\nThat's what it is, now" );
		assert.equal( res, "It's [F#m]what it is [|] [D] [E] [|]\nThat's what it [F#m]is, now [|] [D] [E] [|]" );
		assert.deepEqual( parse( res ).sections[0].chords[0], [ "", "F#m", "|", "D", "E", "|" ] );
	} );

	it( "keeps chord lines that have no lyric", () => {
		const res = toChordPro( "[Intro]\n| F#m | D E |\n\n[Verse]\nG   D\n\nG\nWords" );
		assert.equal( res, "{section: Intro}\n[|] [F#m] [|] [D] [E] [|]\n\n{section: Verse}\n[G] [D]\n\n[G]Words" );
	} );

	it( "does not treat a count line as a lyric", () => {
		const res = toChordPro( "| F#m | D E |\n        1 + 2 +\n| F#m | D   E" );
		assert.equal( res, "[|] [F#m] [|] [D] [E] [|]\n        1 + 2 +\n[|] [F#m] [|] [D] [E]" );
	} );

	it( "lines up chords after tabs and non-breaking spaces", () => {
		assert.equal( toChordPro( "\tG\xa0\xa0\xa0D\nAmazing grace\nC\nhow sweet" ), "Amazing [G]grac[D]e\n[C]how sweet" );
	} );

	it( "reads the title and artist from the header", () => {
		const header = "-----\n   My Song – Some Band\n-----\nKey: G\nBPM: 90\nCapo: 2nd fret\nTabbed by: someone\n\n";
		const chart = parse( toChordPro( header + song ) );
		assert.equal( chart.title, "My Song" );
		assert.deepEqual( chart.artist, [ "Some Band" ] );
		assert.equal( chart.key, "G" );
		assert.equal( chart.tempo, "90" );
		assert.equal( chart.subtitle, "Capo: 2nd fret" );
		assert.equal( chart.sections.length, 1 );
		assert.equal( parse( toChordPro( `My Song chords by Some Band\n\n${ song }` ) ).title, "My Song" );
		assert.equal( parse( toChordPro( `Stand by Me\n\n${ song }` ) ).title, "Stand by Me" );
	} );

	it( "returns text without chords unchanged", () => {
		assert.equal( toChordPro( "Just some words\nand more" ), "Just some words\nand more" );
	} );

	it( "converts a full chart", async () => {
		const text = await fs.readFile( "./tests/chords-over-text.txt", "utf-8" );
		assert.ok( isChordsOverText( text ) );
		const converted = toChordPro( text );
		assert.ok( !isChordsOverText( converted ) );
		const chart = parse( converted );
		assert.equal( chart.title, "What It Is" );
		assert.deepEqual( chart.artist, [ "Mark Knopfler", "Written by: Mark Knopfler" ] );
		assert.equal( chart.subtitle, "From: “Sailing to Philadelphia” (2000)" );
		assert.deepEqual( chart.sections.map( s => s.title ), [
			"Intro", "Verse", "Chorus", "Verse", "Bridge", "Chorus", "Verse", "Bridge", "Chorus",
			"Solo", "Verse", "Chorus", "Instrumental", "Outro Solo", "Coda"
		] );
		assert.deepEqual( chart.sections[1].chords[0], [ "", "F#m", "A" ] );
		assert.deepEqual( chart.sections[1].lyrics[0], [ "The ", "drinking dens are spilling out and ", "staggering in the square," ] );
	} );
} );
