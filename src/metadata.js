import { parseSection } from "./chordpro.js";

export const metadataFields = [ "title", "subtitle", "artist", "key", "tempo", "time" ];
const artistTypes = [ "artist", "composer", "lyricist" ];

function fieldOf( type ) {
	if ( artistTypes.includes( type ) ) {
		return "artist";
	}
	return metadataFields.includes( type ) ? type : "";
}

// Finds the metadata directive lines the same way parse() reads them, stopping at the CCLI footer.
function findDirectives( lines ) {
	const directives = [];
	for ( let i = 0; i < lines.length; i++ ) {
		const line = lines[i].trim();
		if ( line.startsWith( "{" ) ) {
			const { type, text } = parseSection( lines[i] );
			const field = fieldOf( type );
			if ( field ) {
				directives.push( { index: i, type, field, text } );
			}
		} else if ( line.startsWith( "CCLI" ) ) {
			break;
		}
	}
	return directives;
}

// New lines go after the last directive that sorts at or before this field, to keep the usual order.
function getInsertIndex( directives, field ) {
	const order = metadataFields.indexOf( field );
	const preceding = directives.filter( d => metadataFields.indexOf( d.field ) <= order );
	if ( preceding.length > 0 ) {
		return preceding[preceding.length - 1].index + 1;
	}
	return directives.length > 0 ? directives[0].index : 0;
}

// Returns the chordpro text with one metadata field set to a new value; an empty value removes it.
// The artist field holds one name per line, and existing composer/lyricist lines keep their directive.
export function setMetadata( chordProText, field, value ) {
	const lines = chordProText.split( "\n" );
	const eol = lines.some( l => l.endsWith( "\r" ) ) ? "\r" : "";
	const directives = findDirectives( lines );
	const existing = directives.filter( d => d.field === field );
	const values = ( field === "artist" ? value.split( "\n" ) : [ value ] ).map( v => v.trim() ).filter( v => v !== "" );
	// parse() keeps the last of a repeated single-value directive, so that is the one to change
	const targets = field === "artist" || values.length === 0 ? existing : existing.slice( -1 );

	const removed = [];
	targets.forEach( ( directive, i ) => {
		if ( i >= values.length ) {
			removed.push( directive.index );
		} else if ( directive.text !== values[i] ) {
			lines[directive.index] = `{${ directive.type }: ${ values[i] }}${ lines[directive.index].endsWith( "\r" ) ? "\r" : "" }`;
		}
	} );
	removed.reverse().forEach( index => lines.splice( index, 1 ) );

	const added = values.slice( targets.length ).map( v => `{${ field }: ${ v }}${ eol }` );
	if ( added.length > 0 ) {
		// the first metadata line added above existing chart text gets a blank line after it
		if ( directives.length === 0 && lines[0].trim() !== "" ) {
			added.push( eol );
		}
		lines.splice( getInsertIndex( directives, field ), 0, ...added );
	}
	return lines.join( "\n" );
}
