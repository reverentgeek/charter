const chordPattern = /^\(?[A-G][#b♯♭]?(?:maj|min|dim|aug|sus|add|no|M|m|\+|-|°|ø|[#b♯♭]?\d+|\(|\))*(?:\/[A-G][#b♯♭]?)?\)?$/;
// Things that sit on a chord line without being chords: bar lines, repeats, N.C., x2
const fillerPattern = /^(?::?\|+:?|[-–/%]|\*+|N\.?C\.?|\(?x\d+\)?|\(?\d+x\)?)$/i;
const tokenPattern = /:?\|+:?|[^\s|]+/g;
const rulerPattern = /^[-=_*~#]{3,}$/;
const sectionPattern = /^\[([^\]]+)\]$/;
const labelPattern = /^([A-Za-z][A-Za-z ]*?)\s*:\s*(.+)$/;
const titleDashPattern = /^(.+?)\s+[-–—]\s+(.+)$/;
const titleByPattern = /^(.+?)\s+(?:chords|tabs?)\s+by\s+(.+)$/i;
const tabSize = 8;
const minChordLines = 2;

// Header labels that have a home in the chart; any other "Label: value" line is dropped.
const headerLabels = {
	title: "title",
	song: "title",
	artist: "artist",
	band: "artist",
	key: "key",
	tempo: "tempo",
	bpm: "tempo",
	time: "time",
	"time signature": "time"
};
const creditLabels = [ "written by", "words by", "music by", "lyrics by", "composer", "composed by" ];
const subtitleLabels = [ "from", "album", "capo" ];
const directiveOrder = [ "title", "subtitle", "artist", "key", "tempo", "time" ];

function expandTabs( line ) {
	let expanded = "";
	for ( const char of line ) {
		expanded += char === "\t" ? " ".repeat( tabSize - expanded.length % tabSize ) : char;
	}
	return expanded;
}

// Chord positions are columns, so tabs and non-breaking spaces have to become plain spaces first.
function toLines( text ) {
	return text.replace( /\r\n?/g, "\n" ).replace( /\xa0/g, " " ).split( "\n" ).map( expandTabs );
}

function getTokens( line ) {
	return [ ...line.matchAll( tokenPattern ) ].map( m => ( { text: m[0], col: m.index } ) );
}

export function isChordLine( line ) {
	const tokens = getTokens( line );
	const chords = tokens.filter( t => chordPattern.test( t.text ) );
	return chords.length > 0 && tokens.every( t => chords.includes( t ) || fillerPattern.test( t.text ) );
}

function isSection( line ) {
	return sectionPattern.test( line.trim() );
}

// A line of counts or strumming marks ("1 + 2 +") under a chord line is not a lyric.
function isLyricLine( line ) {
	const trimmed = line.trim();
	return /\p{L}/u.test( trimmed ) && !rulerPattern.test( trimmed ) && !isSection( line ) && !isChordLine( line );
}

function hasInlineChord( line ) {
	return [ ...line.matchAll( /\[([^\]]+)\]/g ) ].some( m => chordPattern.test( m[1] ) );
}

// True when the text has chords on their own lines above the lyrics, and nothing that marks it as ChordPro.
export function isChordsOverText( text ) {
	let chordLines = 0;
	for ( const line of toLines( text ) ) {
		if ( line.trim().startsWith( "{" ) ) {
			return false;
		}
		if ( !isSection( line ) && hasInlineChord( line ) ) {
			return false;
		}
		if ( isChordLine( line ) ) {
			chordLines++;
		}
	}
	return chordLines >= minChordLines;
}

// Puts each chord into the lyric at the column it sits above; chords past the end of the lyric trail it.
function mergeLine( tokens, lyric ) {
	const end = lyric.trimEnd().length;
	const trailing = [];
	let merged = "";
	let pos = 0;
	for ( const { text, col } of tokens ) {
		if ( col >= end ) {
			trailing.push( `[${ text }]` );
		} else {
			merged += `${ lyric.slice( pos, col ) }[${ text }]`;
			pos = col;
		}
	}
	merged += lyric.slice( pos, end );
	return [ merged, ...trailing ].join( " " );
}

// Reads the lines above the first section or chord line: a "Title - Artist" line and "Label: value" lines.
function convertHeader( lines ) {
	const found = [];
	const subtitle = [];
	const notes = [];
	let titled = false;
	for ( const line of lines ) {
		const trimmed = line.trim();
		if ( trimmed === "" || rulerPattern.test( trimmed ) ) {
			continue;
		}
		const label = trimmed.match( labelPattern );
		if ( label ) {
			const name = label[1].toLowerCase();
			if ( headerLabels[name] ) {
				found.push( [ headerLabels[name], label[2].trim() ] );
				titled ||= headerLabels[name] === "title";
			} else if ( creditLabels.includes( name ) ) {
				found.push( [ "artist", trimmed ] );
			} else if ( subtitleLabels.includes( name ) ) {
				subtitle.push( trimmed );
			}
		} else if ( !titled ) {
			const [ , title, artist ] = trimmed.match( titleDashPattern ) ?? trimmed.match( titleByPattern ) ?? [ "", trimmed ];
			found.push( [ "title", title ] );
			if ( artist ) {
				found.push( [ "artist", artist ] );
			}
			titled = true;
		} else {
			notes.push( trimmed );
		}
	}
	if ( subtitle.length > 0 ) {
		found.push( [ "subtitle", subtitle.join( " | " ) ] );
	}
	const directives = directiveOrder.flatMap( type => found.filter( f => f[0] === type ) ).map( ( [ type, value ] ) => `{${ type }: ${ value }}` );
	return [ ...directives, "", ...notes ];
}

// Converts chords-over-text to ChordPro. Text with no chord lines or sections is returned as it is.
export function toChordPro( text ) {
	const lines = toLines( text );
	const start = lines.findIndex( l => isChordLine( l ) || isSection( l ) );
	if ( start === -1 ) {
		return text;
	}
	const out = convertHeader( lines.slice( 0, start ) );
	for ( let i = start; i < lines.length; i++ ) {
		const trimmed = lines[i].trim();
		const section = trimmed.match( sectionPattern );
		if ( rulerPattern.test( trimmed ) ) {
			continue;
		}
		if ( section ) {
			out.push( `{section: ${ section[1].trim() }}` );
		} else if ( isChordLine( lines[i] ) ) {
			const tokens = getTokens( lines[i] );
			if ( i + 1 < lines.length && isLyricLine( lines[i + 1] ) ) {
				out.push( mergeLine( tokens, lines[i + 1] ) );
				i++;
			} else {
				out.push( tokens.map( t => `[${ t.text }]` ).join( " " ) );
			}
		} else {
			out.push( lines[i].trimEnd() );
		}
	}
	// one blank line between blocks, none at the ends
	return out.filter( ( line, i ) => line !== "" || ( i > 0 && out[i - 1] !== "" ) ).join( "\n" ).trim();
}
