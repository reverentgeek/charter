// Transposes a parsed chart (see parse() in chordpro.js) by a number of half steps or to a new key, and turns
// lettered chords into Nashville numbers. Numbers are relative to the key, so transposing leaves them as written.

const letters = [ "C", "D", "E", "F", "G", "A", "B" ];
const naturalPitches = [ 0, 2, 4, 5, 7, 9, 11 ];
const accidentals = { "#": 1, "♯": 1, b: -1, "♭": -1 };

// How a key is usually written for each pitch, C = 0
const majorKeys = [ "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B" ];
const minorKeys = [ "C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B" ];
const sharpNotes = [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ];
const flatNotes = [ "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B" ];
const flatMinorKeys = [ "D", "G", "C", "F" ];
const awkwardNotes = [ "E#", "B#", "Cb", "Fb" ];

// A note name at the start of a chord, or after a slash, an opening parenthesis, or a space
const notePattern = /(^|[\s/(])([A-G])([#♯b♭]?)/g;
const qualityWords = /maj|min|dim|aug|sus|add|alt|no|m|M|o/g;
const qualitySymbols = /^[\d#♯b♭+°ø^()\-.,Δ/]*$/;
const keyPattern = /^([A-G])([#♯b♭]?)(.*)$/;

function mod( n, m ) {
	return ( ( n % m ) + m ) % m;
}

function toNote( letter, accidental = "" ) {
	const index = letters.indexOf( letter );
	return { index, pitch: mod( naturalPitches[index] + ( accidentals[accidental] ?? 0 ), 12 ) };
}

// Reads a key such as "G", "F#m", or "Bb major"; returns null when it doesn't start with a note name.
export function parseKey( text ) {
	const match = String( text ?? "" ).trim().match( keyPattern );
	if ( !match ) {
		return null;
	}
	const [ , letter, accidental, rest ] = match;
	return {
		...toNote( letter, accidental ),
		name: `${ letter }${ accidental }`,
		minor: /^\s*(m(?!aj)|min)/i.test( rest ),
		rest
	};
}

function isChordToken( token ) {
	const remaining = token.replace( notePattern, "$1" ).replace( qualityWords, "" );
	return remaining !== token && qualitySymbols.test( remaining.trim() );
}

// The quality that decides which keys a chord belongs to. "any" is a chord with no third
// (sus, power chords, G2, (no3)), which fits a key whether the key has it major or minor.
function chordQuality( quality ) {
	if ( /^(dim|o|°|ø|m7b5|m7-5|-7b5)/.test( quality ) ) {
		return "dim";
	}
	if ( /^(sus|5|2(?!\d)|4|\(4\))/.test( quality ) || quality.includes( "no3" ) ) {
		return "any";
	}
	return /^(m(?!aj)|min|-)/.test( quality ) ? "min" : "maj";
}

// Every lettered chord in the chart, in order, as { pitch, name, quality }. A slash chord counts as its upper chord.
export function chordList( chart ) {
	const chords = [];
	for ( const section of chart.sections ) {
		for ( const line of section.chords ) {
			for ( const chord of line ) {
				for ( const token of chord.trim().split( /\s+/ ).filter( isChordToken ) ) {
					const match = token.replace( /^\(+/, "" ).split( "/" )[0].match( keyPattern );
					if ( match ) {
						const [ , letter, accidental, quality ] = match;
						chords.push( {
							pitch: toNote( letter, accidental ).pitch,
							name: letter + ( accidentals[accidental] === 1 ? "#" : accidentals[accidental] === -1 ? "b" : "" ),
							quality: chordQuality( quality )
						} );
					}
				}
			}
		}
	}
	return chords;
}

// How well a chord fits a key, by its distance in half steps above the tonic and its quality.
// Chords in the key score 1. Common borrowed chords and secondary dominants score 0.5, and anything else costs 1.
// The bVII and v of Mixolydian are so common in a major key (A G D, D Am G) that they score 0.75.
// A secondary dominant (II, III, or VI in a major key) only counts when it moves down a fifth, as it does in that key.
// The minor key includes the major V and vii° of harmonic minor.
const keyFit = {
	major: {
		maj: { 0: 1, 5: 1, 7: 1, 2: 0.5, 3: 0.5, 4: 0.5, 8: 0.5, 9: 0.5, 10: 0.75 },
		min: { 2: 1, 4: 1, 9: 1, 5: 0.5, 7: 0.75 },
		dim: { 11: 1 }
	},
	minor: {
		maj: { 3: 1, 7: 1, 8: 1, 10: 1, 0: 0.5, 5: 0.5 },
		min: { 0: 1, 5: 1, 7: 1, 2: 0.5 },
		dim: { 2: 1, 11: 1 }
	}
};

const secondaryDominants = [ 2, 4, 9 ];

// `resolves` is whether the next chord is a fifth below this one.
function fit( mode, interval, quality, resolves ) {
	const score = ( q ) => {
		if ( q === "maj" && mode === "major" && secondaryDominants.includes( interval ) && !resolves ) {
			return -1;
		}
		return keyFit[mode][q][interval] ?? -1;
	};
	// Chords with no third (D2, Dsus, A5) are nearly always major chords in a chart, so they count fully as major
	// and only half as minor.
	return quality === "any" ? Math.max( score( "maj" ), score( "min" ) / 2 ) : score( quality );
}

function isTonic( chord, tonic, minor ) {
	return chord?.pitch === tonic && ( minor ? chord.quality === "min" : chord.quality !== "min" && chord.quality !== "dim" );
}

// A major key and its relative minor share their chords (G and Em), so the minor key has to beat
// the major key by this much: by ending on its tonic, a major V, or leaning on its tonic chord.
const relativeMinorMargin = 1;

// Scores how strongly the chords point to a key: how many fit it, then how much the music leans on its tonic
// (how often the tonic is played, V-I and IV-I cadences into it, and whether the chart ends or starts on it).
// Also returns the fit alone, to settle a tie in favor of the key that needs fewer borrowed chords.
function scoreKey( chords, tonic, minor ) {
	const mode = minor ? "minor" : "major";
	let score = 0;
	let chordFit = 0;
	chords.forEach( ( chord, i ) => {
		const resolves = mod( chords[i + 1]?.pitch - chord.pitch, 12 ) === 5;
		const chordScore = fit( mode, mod( chord.pitch - tonic, 12 ), chord.quality, resolves );
		chordFit += chordScore;
		score += chordScore;
		if ( !isTonic( chord, tonic, minor ) ) {
			return;
		}
		score += 0.5;
		const before = chords[i - 1];
		if ( before ) {
			const interval = mod( before.pitch - tonic, 12 );
			// a cadence needs the leading tone, so a sus or "2" chord with no third doesn't make one
			if ( ( interval === 7 && before.quality === "maj" ) || ( interval === 11 && before.quality === "dim" ) ) {
				score += 0.5;
			} else if ( interval === 5 && ( before.quality === "any" || before.quality === ( minor ? "min" : "maj" ) ) ) {
				score += 0.25;
			}
		}
	} );
	// Songs nearly always start on the tonic; a chart's last chord is often a turnaround, so it counts for less.
	if ( isTonic( chords[0], tonic, minor ) ) {
		score += 1;
	}
	if ( isTonic( chords[chords.length - 1], tonic, minor ) ) {
		score += 0.5;
	}
	return { score, fit: chordFit };
}

// Works out a chart's key from its chords; returns null when it has no lettered chords.
// A tie goes to the key whose chords fit it best, so Em C G D is in G (not D, which would borrow the C),
// and a minor key needs a clear lead over its relative major (G, not E minor).
export function detectKey( chart ) {
	const chords = chordList( chart );
	if ( chords.length === 0 ) {
		return null;
	}
	let best;
	const scores = [];
	for ( const minor of [ false, true ] ) {
		for ( let tonic = 0; tonic < 12; tonic++ ) {
			const key = { ...scoreKey( chords, tonic, minor ), tonic, minor };
			scores.push( key );
			if ( !best || key.score > best.score || ( key.score === best.score && key.fit > best.fit ) ) {
				best = key;
			}
		}
	}
	const relative = best.minor && scores[mod( best.tonic + 3, 12 )];
	if ( relative && relative.score + relativeMinorMargin >= best.score ) {
		best = relative;
	}
	// Spell the key the way the chart spells its tonic chord, so a chart in C# doesn't come out as Db.
	const written = chords.filter( c => c.pitch === best.tonic ).map( c => c.name );
	const name = written.length > 0
		? written.sort( ( a, b ) => written.filter( n => n === b ).length - written.filter( n => n === a ).length )[0]
		: ( best.minor ? minorKeys : majorKeys )[best.tonic];
	return { ...toNote( name[0], name.slice( 1 ) ), name, minor: best.minor, rest: best.minor ? "m" : "" };
}

// The chart's key, or, when it has none, the key its chords point to.
export function findKey( chart ) {
	return parseKey( chart.key ) ?? detectKey( chart );
}

function prefersFlats( key ) {
	return key.name.length > 1 ? key.name.endsWith( "b" ) || key.name.endsWith( "♭" ) : key.minor ? flatMinorKeys.includes( key.name ) : key.name === "F";
}

// Keeps a note's place in the scale: the flat seventh in C (Bb) becomes C in D, not A#.
// Spellings no one reads easily (double sharps, E#, Cb...) fall back to the plain name for that pitch.
function spellNote( note, from, to ) {
	const index = mod( to.index + note.index - from.index, 7 );
	const pitch = mod( to.pitch + note.pitch - from.pitch, 12 );
	const offset = mod( pitch - naturalPitches[index] + 6, 12 ) - 6;
	const name = letters[index] + ( offset === 1 ? "#" : offset === -1 ? "b" : "" );
	if ( Math.abs( offset ) > 1 || awkwardNotes.includes( name ) ) {
		return ( prefersFlats( to ) ? flatNotes : sharpNotes )[pitch];
	}
	return name;
}

function transposeToken( token, from, to ) {
	if ( !isChordToken( token ) ) {
		return token;
	}
	return token.replace( notePattern, ( _, before, letter, accidental ) => before + spellNote( toNote( letter, accidental ), from, to ) );
}

export function transposeChord( chord, from, to ) {
	return chord.split( /(\s+)/ ).map( token => transposeToken( token, from, to ) ).join( "" );
}

// The key reached by moving a key a number of half steps, spelled the way that key is usually written.
export function transposeKey( key, steps ) {
	const pitch = mod( key.pitch + steps, 12 );
	const name = ( key.minor ? minorKeys : majorKeys )[pitch];
	return { ...toNote( name[0], name.slice( 1 ) ), name, minor: key.minor, rest: key.rest };
}

// Reads a transpose setting: a whole number of half steps ("-2", "+3") or a key to move to ("A", "Bb").
export function parseTranspose( value ) {
	const text = String( value ?? "" ).trim();
	if ( /^[+-]?\d+$/.test( text ) ) {
		return Number( text );
	}
	if ( /^[A-G][#♯b♭]?$/.test( text ) ) {
		return text;
	}
	throw new Error( `"${ text }" is not a transposition. Use a number of half steps, like 2 or -3, or a key, like A or Bb.` );
}

// Returns a transposed copy of the chart. `by` is a number of half steps, or a key name whose root the key moves to.
export function transpose( chart, by ) {
	const from = findKey( chart );
	if ( !from ) {
		if ( typeof by === "string" ) {
			throw new Error( `${ chart.title || "This chart" } has no key or lettered chords, so it can't be transposed to ${ by }.` );
		}
		return chart;
	}
	let to;
	if ( typeof by === "string" ) {
		const target = parseKey( by );
		if ( !target ) {
			throw new Error( `"${ by }" is not a key.` );
		}
		to = { ...target, minor: from.minor, rest: from.rest };
	} else {
		to = transposeKey( from, by );
	}
	if ( to.name === from.name ) {
		return chart;
	}
	return {
		...chart,
		key: parseKey( chart.key ) ? `${ to.name }${ to.rest }` : chart.key,
		sections: chart.sections.map( section => ( {
			...section,
			chords: section.chords.map( line => line.map( chord => transposeChord( chord, from, to ) ) )
		} ) )
	};
}

// The major scale in half steps above the tonic, and every degree by half steps for spellings that don't give a plain one
const majorScale = naturalPitches;
const degreeNames = [ "1", "b2", "2", "b3", "3", "4", "#4", "5", "b6", "6", "b7", "7" ];

function relativeMajor( key ) {
	return { index: mod( key.index + 2, 7 ), pitch: mod( key.pitch + 3, 12 ) };
}

// A note as a Nashville number in a key, measured against the major scale. The spelling decides sharp or flat:
// A# in G is #2, Bb is b3. A minor key is numbered from its relative major, so Em C G D in E minor is 6m 4 1 5.
function toNumber( note, minorOrMajorKey ) {
	const key = minorOrMajorKey.minor ? relativeMajor( minorOrMajorKey ) : minorOrMajorKey;
	const steps = mod( note.index - key.index, 7 );
	const offset = mod( note.pitch - key.pitch - majorScale[steps] + 6, 12 ) - 6;
	if ( Math.abs( offset ) > 1 ) {
		return degreeNames[mod( note.pitch - key.pitch, 12 )];
	}
	return ( offset === 1 ? "#" : offset === -1 ? "b" : "" ) + ( steps + 1 );
}

// Writes a chord as numbers in a key: Em7 in G is 6m7, D/F# is 5/7. Anything that isn't a lettered chord stays as it is.
export function chordToNumbers( chord, key ) {
	return chord.split( /(\s+)/ ).map( ( token ) => {
		if ( !isChordToken( token ) ) {
			return token;
		}
		return token.replace( notePattern, ( _, before, letter, accidental ) => before + toNumber( toNote( letter, accidental ), key ) );
	} ).join( "" );
}

// Returns a copy of the chart with its chords as Nashville numbers. A chart without a key gets the one its chords
// point to, since a number chart means nothing without it. A chart with no lettered chords comes back as it is.
export function toNumbers( chart ) {
	const key = findKey( chart );
	if ( !key ) {
		return chart;
	}
	return {
		...chart,
		key: chart.key || `${ key.name }${ key.rest }`,
		sections: chart.sections.map( section => ( {
			...section,
			chords: section.chords.map( line => line.map( chord => chordToNumbers( chord, key ) ) )
		} ) )
	};
}
