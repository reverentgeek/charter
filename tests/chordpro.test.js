"use strict";
const chordpro = require( "../src/chordpro" );
const fs = require( "fs" ).promises;

test( "parses a line of chordpro text", () => {
	const res = chordpro.parseLyricLine( "Give me [A]eyes to see [E]more of who you [B]are" );
	expect( res.chords.length ).toEqual( res.lyrics.length );
	expect( res ).toStrictEqual( {
		chords: [ "", "A", "E", "B" ],
		lyrics: [ "Give me ", "eyes to see ", "more of who you ", "are" ]
	} );
} );

test( "parses a line of chordpro text ending with a chord", () => {
	const res = chordpro.parseLyricLine( "Give me [A]eyes to see [E]more of who you are[B]" );
	expect( res.chords.length ).toEqual( res.lyrics.length );
	expect( res ).toStrictEqual( {
		chords: [ "", "A", "E", "B" ],
		lyrics: [ "Give me ", "eyes to see ", "more of who you are", "" ]
	} );
} );

test( "parses a line of chordpro text with sharp/minor", () => {
	const res = chordpro.parseLyricLine( "There is [A]nothing that could [E]ever sepa - [B]rate us from Your [C#m]love" );
	expect( res.chords.length ).toEqual( res.lyrics.length );
	expect( res ).toStrictEqual( {
		chords: [ "", "A", "E", "B", "C#m" ],
		lyrics: [ "There is ", "nothing that could ", "ever sepa - ", "rate us from Your ", "love" ]
	} );
} );

test( "parses a line of embedded chord chordpro text", () => {
	const res = chordpro.parseLyricLine( "There is no[A]thing that could [E]ever" );
	expect( res.chords.length ).toEqual( res.lyrics.length );
	expect( res ).toStrictEqual( {
		chords: [ "", "A", "E" ],
		lyrics: [ "There is no", "thing that could ", "ever" ]
	} );
} );

test( "parses a line with comments", () => {
	const res = chordpro.parseLyricLine( "I am a believer  [Ab]    [Eb]    [Cm]    [Bb] (2nd x to Br.)" );
	expect( res.chords.length ).toEqual( res.lyrics.length );
	expect( res ).toStrictEqual( {
		chords: [ "", "Ab", "Eb", "Cm", "Bb", "(2nd x to Br.)" ],
		lyrics: [ "I am a believer  ", "    ", "    ", "    ", " ", "" ]
	} );
} );

test( "parses a line of just chords (e.g. intro/turnaround)", () => {
	const res = chordpro.parseLyricLine( "[|] [A]            [|] [B]            [|] [A]            [|] [B]            [|] " );
	expect( res.chords.length ).toEqual( res.lyrics.length );
	expect( res ).toStrictEqual( {
		chords: [ "|", "A", "|", "B", "|", "A", "|", "B", "|" ],
		lyrics: [ " ", "            ", " ", "            ", " ", "            ", " ", "            ", " " ]
	} );
} );

test( "parses a line with chords ahead of lyrics", () => {
	const res = chordpro.parseLyricLine( "[Ab] I hold my [Eb]head a bit higher,  [Bb] I lift my [Cm]voice a bit louder" );
	expect( res.chords.length ).toEqual( res.lyrics.length );
	expect( res ).toStrictEqual( {
		chords: [ "Ab", "", "Eb", "Bb", "", "Cm" ],
		lyrics: [ " ", "I hold my ", "head a bit higher,  ", " ", "I lift my ", "voice a bit louder" ]
	} );
} );

test( "parses a line with a comment at the end", () => {
	const res = chordpro.parseLyricLine( "I [6m]walk with the king of [5]victory (REPEAT)" );
	expect( res.chords.length ).toEqual( res.lyrics.length );
	expect( res ).toStrictEqual( {
		chords: [ "", "6m", "5", "(REPEAT)" ],
		lyrics: [ "I ", "walk with the king of ", "victory ", "" ]
	} );
} );

test( "parses a title section", () => {
	const res = chordpro.parseSection( "{title: This is a Title}" );
	expect( res ).toStrictEqual( { type: "title", text: "This is a Title" } );
} );

test( "parses a title section, various case", () => {
	const res = chordpro.parseSection( "{TITLE: This is a Title}" );
	expect( res ).toStrictEqual( { type: "title", text: "This is a Title" } );
} );

test( "parses artist section with random spaces", () => {
	const res = chordpro.parseSection( "{ artist:  John Smith }" );
	expect( res ).toStrictEqual( { type: "artist", text: "John Smith" } );
} );

test( "parses artist section with embedded colons spaces", () => {
	const res = chordpro.parseSection( "{ artist:  Music by: John Smith }" );
	expect( res ).toStrictEqual( { type: "artist", text: "Music by: John Smith" } );
} );

test( "parses key section", () => {
	const res = chordpro.parseSection( "{key: A}" );
	expect( res ).toStrictEqual( { type: "key", text: "A" } );
} );

test( "parses time section", () => {
	const res = chordpro.parseSection( "{time: 3/4}" );
	expect( res ).toStrictEqual( { type: "time", text: "3/4" } );
} );

test( "parses tempo section", () => {
	const res = chordpro.parseSection( "{tempo: 120}" );
	expect( res ).toStrictEqual( { type: "tempo", text: "120" } );
} );

test( "parses verse section", () => {
	const res = chordpro.parseSection( "{comment:verse 1}" );
	expect( res ).toStrictEqual( { type: "comment", text: "verse 1" } );
} );

test( "parses chorus section", () => {
	const res = chordpro.parseSection( "{comment:chorus}" );
	expect( res ).toStrictEqual( { type: "comment", text: "chorus" } );
} );

test( "parses unknown section as comment", () => {
	const res = chordpro.parseSection( "{chorus}" );
	expect( res ).toStrictEqual( { type: "comment", text: "chorus" } );
} );

test ( "parses entire chordpro file", async () => {
	const text = await fs.readFile( "./tests/test.chordpro", "utf8" );
	const res = chordpro.parse( text );
	expect( res.title ).toBe( "Believer" );
	expect( res.subtitle ).toBe( "(as published by Essential Music Publishing)" );
	expect( res.artist ).toStrictEqual( [ "Bryan Fowler, Mitch Wong, Rhett Walker" ] );
	expect( res.key ).toBe( "Eb" );
	expect( res.tempo ).toBe( "87" );
	expect( res.time ).toBe( "4/4" );
	expect( res.sections.length ).toBe( 2 );
	expect( res.sections[0].title ).toBe( "Verse 1" );
	expect( res.sections[1].title ).toBe( "Chorus 1" );
	expect( res.sections[0].chords.length ).toBe( 4 );
	expect( res.sections[0].lyrics.length ).toBe( 4 );
	expect( res.sections[1].chords.length ).toBe( 6 );
	expect( res.sections[1].lyrics.length ).toBe( 6 );
	expect( res.sections[0].chords[0] ).toStrictEqual( [ "Ab", "Eb", "Bb", "Cm" ] );
	expect( res.sections[0].lyrics[0] ).toStrictEqual( [ "   ", "I walk a bit different ", "now   ", "" ] );
	expect( res.footer.length ).toBe( 4 );
} );

test ( "parses a single line chordpro file", async () => {
	const res = chordpro.parse( `{comment: Verse 1}
[1]A very [4]short [5]song` );
	expect( res.title ).toBe( "" );
	expect( res.subtitle ).toBe( "" );
	expect( res.artist ).toStrictEqual( [] );
	expect( res.key ).toBe( "" );
	expect( res.tempo ).toBe( "" );
	expect( res.time ).toBe( "" );
	expect( res.sections.length ).toBe( 1 );
	expect( res.sections[0].title ).toBe( "Verse 1" );
	expect( res.sections[0].chords.length ).toBe( 1 );
	expect( res.sections[0].lyrics.length ).toBe( 1 );
	expect( res.sections[0].chords[0] ).toStrictEqual( [ "1", "4", "5" ] );
	expect( res.sections[0].lyrics[0] ).toStrictEqual( [ "A very ", "short ", "song" ] );
	expect( res.footer.length ).toBe( 0 );
} );
