"use strict";

function parseLyricLine( lyricLine ) {
	const chunks = lyricLine.split( /(\[[^\]]*\]\s+|\[[^\]]*\][\w][^[()]+|\([^)]*\))/ ).filter( t => t !== "" );
	// console.log( chunks );
	const chords = [];
	const lyrics = [];
	for( let i = 0; i < chunks.length; i++ ) {
		if ( chunks[i].indexOf( "[" ) > -1 ) {
			const subchunks = chunks[i].split( /(\[[^\]]*\])/ ).filter( t => t !== "" );
			chords.push( subchunks[0].replace( "[", "" ).replace( "]", "" ) );
			lyrics.push( subchunks.length === 2 ? subchunks[ 1 ] : "" );
		}
		else if ( chunks[i].startsWith( "(" ) ) {
			chords.push( chunks[i] );
			lyrics.push( "" );
		} else {
			chords.push( "" );
			lyrics.push( chunks[i] );
		}
	}
	return { chords, lyrics };
}

function parseSection( line ) {
	const text = line.replace( "{", "" ).replace( "}", "" );
	const parts = text.split( ":" );
	return parts.length > 1 ? { type: parts[0].toLowerCase().trim(), text: parts.slice( 1 ).join( ":" ).trim() } : { type: parts[0].trim(), text: parts[0].trim() };
}

function parse( chordProText ) {
	const lines = chordProText.split( "\n" );
	const parsed = {
		title: "",
		subtitle: "",
		artist: [],
		key: "",
		tempo: "",
		time: "",
		sections: [],
		footer: []
	};
	let sectionIndex = -1;
	for( let i = 0; i < lines.length; i++ ) {
		if ( lines[i].trim().startsWith( "{" ) ) {
			const section = parseSection( lines[i] );
			switch( section.type ) {
			case "title":
				parsed.title = section.text;
				break;
			case "subtitle":
				parsed.subtitle = section.text;
				break;
			case "artist":
			case "composer":
			case "lyricist":
				parsed.artist.push( section.text );
				break;
			case "key":
				parsed.key = section.text;
				break;
			case "time":
				parsed.time = section.text;
				break;
			case "tempo":
				parsed.tempo = section.text;
				break;
            case "end_of_chorus":
            case "end_of_verse":
            case "end_of_bridge":
                break;
			default:
				sectionIndex++;
				parsed.sections.push( {
					title: section.text,
					lyrics: [],
					chords: []
				} );
			}
		} else if ( lines[i].trim().length > 0 ) {
			if ( lines[i].trim().startsWith( "CCLI" ) ) {
				while( i < lines.length ) {
					if ( lines[i].trim().length > 0 ) {
						parsed.footer.push( lines[i].trim() );
					}
					i++;
				}
				return parsed;
			}
			const { chords, lyrics } = parseLyricLine( lines[i] );
			parsed.sections[sectionIndex].chords.push( chords );
			parsed.sections[sectionIndex].lyrics.push( lyrics );
		}
	}
	return parsed;
}

module.exports = {
	parse,
	parseLyricLine,
	parseSection
};
