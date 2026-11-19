import { describe, it, before } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import { parse } from "../src/chordpro.js";
import { render } from "../src/html.js";
import { chordToNumbers, detectKey, findKey, parseKey, parseTranspose, toNumbers, transpose, transposeChord, transposeKey } from "../src/transpose.js";

const C = parseKey( "C" );
const D = parseKey( "D" );
const G = parseKey( "G" );
const Bb = parseKey( "Bb" );

describe( "transpose tests", () => {
	let chart;

	before( async () => {
		chart = parse( await fs.readFile( "./tests/test.cho", "utf8" ) );
	} );

	it( "transposes the key and every chord by half steps", () => {
		const res = transpose( chart, 2 );
		assert.equal( res.key, "A" );
		assert.deepEqual( res.sections[0].chords[0], [ "", "A", "A7", "D", "A" ] );
		assert.deepEqual( res.sections[0].chords[3], [ "", "F#m", "E", "A", "" ] );
	} );

	it( "leaves the original chart unchanged", () => {
		transpose( chart, 2 );
		assert.equal( chart.key, "G" );
		assert.deepEqual( chart.sections[0].chords[0], [ "", "G", "G7", "C", "G" ] );
	} );

	it( "transposes to a key", () => {
		const res = transpose( chart, "Bb" );
		assert.equal( res.key, "Bb" );
		assert.deepEqual( res.sections[0].chords[0], [ "", "Bb", "Bb7", "Eb", "Bb" ] );
	} );

	it( "returns the same chart when nothing moves", () => {
		assert.equal( transpose( chart, 0 ), chart );
		assert.equal( transpose( chart, 12 ), chart );
		assert.equal( transpose( chart, "G" ), chart );
	} );

	it( "spells the new key the way it is usually written", () => {
		assert.equal( transposeKey( G, 1 ).name, "Ab" );
		assert.equal( transposeKey( G, -1 ).name, "F#" );
		assert.equal( transposeKey( G, 6 ).name, "Db" );
		assert.equal( transposeKey( parseKey( "Em" ), 4 ).name, "G#" );
		assert.equal( transpose( parse( "{key: Em}\n[Em]Hi" ), 1 ).key, "Fm" );
	} );

	it( "keeps the text after the key's note", () => {
		assert.equal( transpose( parse( "{key: E minor}\n[Em]Hi" ), 2 ).key, "F# minor" );
	} );

	it( "keeps borrowed chords in their place in the scale", () => {
		assert.equal( transposeChord( "Bb", C, D ), "C" );
		assert.equal( transposeChord( "Ab", C, D ), "Bb" );
		assert.equal( transposeChord( "F#/A#", G, Bb ), "A/C#" );
	} );

	it( "falls back to a plain name for awkward spellings", () => {
		assert.equal( transposeChord( "F#", C, parseKey( "B" ) ), "F" );
		assert.equal( transposeChord( "C#m7", C, parseKey( "F#" ) ), "Gm7" );
	} );

	it( "transposes slash chords, qualities, and grouping parentheses", () => {
		assert.equal( transposeChord( "G(4)/B", C, D ), "A(4)/C#" );
		assert.equal( transposeChord( "(Csus", C, D ), "(Dsus" );
		assert.equal( transposeChord( "Am7)", C, D ), "Bm7)" );
		assert.equal( transposeChord( "G2(no3)", C, D ), "A2(no3)" );
		assert.equal( transposeChord( "Ebm7b5", C, D ), "Fm7b5" );
		assert.equal( transposeChord( "Cmaj7", C, D ), "Dmaj7" );
		assert.equal( transposeChord( "(G ... D/F#)", C, D ), "(A ... E/G#)" );
	} );

	it( "leaves Nashville numbers and words alone", () => {
		for ( const chord of [ "4/6", "b72", "2m7", "(4 ... 2m7)", "N.C.", "|", "Bridge", "Coda" ] ) {
			assert.equal( transposeChord( chord, C, D ), chord );
		}
	} );

	it( "moves only the key of a Nashville number chart", () => {
		const res = transpose( parse( "{key: G}\n[1]Hi [4/6]there" ), 2 );
		assert.equal( res.key, "A" );
		assert.deepEqual( res.sections[0].chords[0], [ "1", "4/6" ] );
	} );

	it( "uses the chart's chords when it has no key", () => {
		const text = "{section: Verse}\n[Em]Hi [C]there [G]my [D]friend";
		assert.equal( findKey( parse( text ) ).name, "G" );
		const res = transpose( parse( text ), 2 );
		assert.equal( res.key, "" );
		assert.deepEqual( res.sections[0].chords[0], [ "F#m", "D", "A", "E" ] );
	} );

	it( "prefers the chart's key over its chords", () => {
		assert.equal( findKey( parse( "{key: Em}\n[Em]Hi [C]there [G]my [D]friend" ) ).name, "E" );
	} );

	it( "can't detect a key without lettered chords", () => {
		assert.equal( detectKey( parse( "[1]Hi [4/6]there [N.C.]" ) ), null );
	} );
	it( "can't transpose a chart with no key or lettered chords to a key", () => {
		const numbers = parse( "{title: Song}\n[1]Hi [4]there" );
		assert.equal( transpose( numbers, 2 ), numbers );
		assert.throws( () => transpose( numbers, "A" ), /Song has no key/ );
	} );

	describe( "key detection", () => {
		const detect = ( chords ) => {
			const key = detectKey( parse( chords.map( c => `[${ c }]la` ).join( " " ) ) );
			return key.name + ( key.minor ? "m" : "" );
		};
		const cases = [
			[ "vi-IV-I-V reads as the major key", [ "Em", "C", "G", "D", "Em", "C", "G", "D" ], "G" ],
			[ "I-V-vi-IV", [ "D", "A", "Bm", "G", "D", "A", "Bm", "G" ], "D" ],
			[ "I-IV-V", [ "G", "C", "D", "G" ], "G" ],
			[ "I-IV-V with a seventh", [ "E", "A", "B7", "E", "C#m", "A", "B", "E" ], "E" ],
			[ "a minor key with a major V", [ "Am", "Dm", "E7", "Am" ], "Am" ],
			[ "a minor progression that ends on the tonic", [ "Am", "F", "C", "G", "Am", "F", "C", "G", "Am" ], "Am" ],
			[ "i-VI-III-VII in a flat minor key", [ "Gm", "Eb", "Bb", "F", "Gm", "Eb", "Bb", "F", "Gm" ], "Gm" ],
			[ "a flat major key", [ "Bb", "Eb", "F", "Gm", "Eb", "F", "Bb" ], "Bb" ],
			[ "Mixolydian bVII", [ "A", "G", "D", "A", "G", "D", "A" ], "A" ],
			[ "a I-IV vamp with sus and 2 chords", [ "C2", "F2", "C2", "F2", "Am7", "G(4)", "F2", "C2", "F2" ], "C" ],
			[ "slash chords count as their upper chord", [ "G", "D/F#", "Em7", "C2", "G/B", "Am7", "Dsus", "D", "G" ], "G" ],
			[ "a secondary dominant that resolves", [ "C", "A7", "Dm", "G7", "C" ], "C" ],
			[ "the tonic spelled as the chart spells it", [ "C#", "F#", "G#", "C#" ], "C#" ],
			[ "flat spelling", [ "Db", "Gb", "Ab", "Db" ], "Db" ],
			[ "I-V-vi-IV in C", [ "C", "G", "Am", "F" ], "C" ],
			[ "Aeolian i-bVII-bVI-bVII", [ "Am", "G", "F", "G" ], "Am" ],
			[ "Mixolydian with a minor v", [ "D", "C", "G", "D", "Am", "G", "D" ], "D" ],
			[ "Mixolydian bVII-IV-I", [ "D", "C", "G", "D" ], "D" ],
			[ "I-V-IV-I", [ "G", "D", "C", "G" ], "G" ],
			[ "I-bVII-IV-I", [ "C", "Bb", "F", "C" ], "C" ]
		];
		for ( const [ name, chords, key ] of cases ) {
			it( name, () => assert.equal( detect( chords ), key ) );
		}
	} );

	describe( "numbers", () => {
		it( "writes each chord as its place in the key", () => {
			const res = toNumbers( chart );
			assert.equal( res.key, "G" );
			assert.deepEqual( res.sections[0].chords[0], [ "", "1", "17", "4", "1" ] );
			assert.deepEqual( res.sections[0].chords[3], [ "", "6m", "5", "1", "" ] );
			assert.deepEqual( res.sections[0].lyrics, chart.sections[0].lyrics );
		} );

		it( "keeps the chord quality as written", () => {
			const G = parseKey( "G" );
			const C = parseKey( "C" );
			assert.equal( chordToNumbers( "Em7", G ), "6m7" );
			assert.equal( chordToNumbers( "Cmaj7", G ), "4maj7" );
			assert.equal( chordToNumbers( "Dsus", G ), "5sus" );
			assert.equal( chordToNumbers( "F2", C ), "42" );
			assert.equal( chordToNumbers( "G(4)", C ), "5(4)" );
			assert.equal( chordToNumbers( "G2(no3)", C ), "52(no3)" );
		} );

		it( "writes slash chords, parentheses, and groups", () => {
			const G = parseKey( "G" );
			assert.equal( chordToNumbers( "D/F#", G ), "5/7" );
			assert.equal( chordToNumbers( "C/G", G ), "4/1" );
			assert.equal( chordToNumbers( "(G/B)", G ), "(1/3)" );
			assert.equal( chordToNumbers( "(Csus", G ), "(4sus" );
			assert.equal( chordToNumbers( "Em7)", G ), "6m7)" );
			assert.equal( chordToNumbers( "(G ... D/F#)", G ), "(1 ... 5/7)" );
		} );

		it( "marks chords outside the key with flats and sharps as spelled", () => {
			const G = parseKey( "G" );
			assert.equal( chordToNumbers( "F", G ), "b7" );
			assert.equal( chordToNumbers( "F2", G ), "b72" );
			assert.equal( chordToNumbers( "Bb", G ), "b3" );
			assert.equal( chordToNumbers( "F#/A#", G ), "7/#2" );
			assert.equal( chordToNumbers( "C#dim", G ), "#4dim" );
			assert.equal( chordToNumbers( "Fmaj7", parseKey( "A" ) ), "b6maj7" );
		} );

		it( "numbers a minor key from its relative major", () => {
			const Em = parseKey( "Em" );
			assert.deepEqual( [ "Em", "C", "G", "D", "B7", "Am/E" ].map( c => chordToNumbers( c, Em ) ), [ "6m", "4", "1", "5", "37", "2m/6" ] );
			assert.deepEqual( [ "F#m", "D", "A", "E", "C#7" ].map( c => chordToNumbers( c, parseKey( "F#m" ) ) ), [ "6m", "4", "1", "5", "37" ] );
		} );

		it( "leaves numbers and words alone", () => {
			for ( const chord of [ "1", "4/6", "b72", "N.C.", "|", "Bridge" ] ) {
				assert.equal( chordToNumbers( chord, G ), chord );
			}
		} );

		it( "adds the key a chart without one is in", () => {
			const res = toNumbers( parse( "[Em]Hi [C]there [G]my [D]friend" ) );
			assert.equal( res.key, "G" );
			assert.deepEqual( res.sections[0].chords[0], [ "6m", "4", "1", "5" ] );
			assert.equal( toNumbers( parse( "[Am]Hi [Dm]there [E7]my [Am]friend" ) ).key, "Am" );
		} );

		it( "returns a chart with no lettered chords as it is", () => {
			const numbers = parse( "{key: G}\n[1]Hi [4]there" );
			assert.deepEqual( toNumbers( numbers ).sections, numbers.sections );
		} );

		it( "gives the same numbers in any key", () => {
			assert.deepEqual( toNumbers( transpose( chart, 3 ) ).sections, toNumbers( chart ).sections );
		} );
	} );

	it( "reads a transpose setting", () => {
		assert.equal( parseTranspose( "2" ), 2 );
		assert.equal( parseTranspose( "+3" ), 3 );
		assert.equal( parseTranspose( "-5" ), -5 );
		assert.equal( parseTranspose( "Bb" ), "Bb" );
		assert.equal( parseTranspose( "F#" ), "F#" );
		assert.throws( () => parseTranspose( "H" ), /not a transposition/ );
		assert.throws( () => parseTranspose( "" ), /not a transposition/ );
	} );

	it( "renders the transposed chart", () => {
		const html = render( transpose( chart, -2 ) );
		assert.ok( html.includes( "Key: F" ) );
		assert.ok( html.includes( "<span class=\"charter-chord\">Bb</span>" ) );
	} );
} );
