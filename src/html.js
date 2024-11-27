import fs from "fs-extra";
import ejs from "ejs";
import { join } from "node:path";

let _template;
const chordRegEx = /^(?<flatted>[b#]{0,1})(?<root>[A-G1-7][#♯b♭]?)(?<quality>(2|3|4|5|6|7|9|\(|\)|no|o|\+|add|maj|dim|sus|m|aug){0,5})$/;

async function getChartTemplate() {
	if ( !_template ) {
		const __dirname = import.meta.dirname;
		const chartFile = join( __dirname, "chart.ejs" );
		const text = await fs.readFile( chartFile, "utf8" );
		_template = ejs.compile( text );
	}
	return _template;
}

function parseChord( chord ) {
	const match = chord.match( chordRegEx );
	if ( !match || !match.groups ) {
		return {
			flatted: "",
			root: chord,
			quality: "",
		};
	}
	const g = match.groups;
	return {
		flatted: g["flatted"] ?? "",
		root: g["root"] ?? "",
		quality: g["quality"] ?? "",
	};
}

export function formatChord( chord ) {
	if ( chord.length <= 1 || chord === "N.C." ) {
		return chord;
	}
	const chords = chord.split( "/" );
	const formatted = chords.map( ( c ) => {
		const { flatted, root, quality } = parseChord( c );
		const html = `${ flatted }${ root }${ quality ? "<sup>" + quality + "</sup>" : "" }`;
		return html;
	} );
	return formatted.length > 1 ? formatted.join( "/" ) : formatted[0];
}

function renderLyricLine( body, lyric, chord, direction ) {
	if ( chord ) {
		body.push( `<span class="charter-chord-wrapper"><span class="charter-chord">${ formatChord( chord ) }</span>` );
		body.push( `<span class="charter-chord-lyric">${ lyric.length > 0 ? lyric : " " }</span>` );
		body.push( "</span>" );
		if ( lyric.trim() === "" ) body.push( "    " );
	} else if ( direction ) {
		body.push( `<span class="charter-direction-wrapper"><span class="charter-direction">${ direction }</span></span>` );
	} else {
		body.push( lyric );
	}
}

export function totalLines( sections ) {
	let count = 0;
	sections.forEach( section => count += section.lyrics.length + 1 );
	return count;
}

export function getColumnBreak( sections ) {
	if ( sections.length < 2 ) return 0;
	if ( sections.length === 2 ) return 1;
	const right = [];
	const left = [ ...sections ];
	for( let i = sections.length - 1; i > 0; i-- ) {
		right.push( left.pop() );
		if ( totalLines( right ) === totalLines( left ) ) return i;
		if ( totalLines( right ) >= totalLines( left ) ) return i + 1;
	}
}

export async function render( chart, options = { columns: false } ) {
	const template = await getChartTemplate();
	chart.columns = options.columns;
	const columnBreak = options.columns ? getColumnBreak( chart.sections ) : 0;
	const body = [];
	if ( chart.sections.length > 0 ) {
		body.push( "<pre class=\"charter-song-body\">" );
		chart.sections.forEach( ( section, index ) => {
			if ( columnBreak > 0 && index === 0 ) {
				body.push( "<span class=\"charter-column left-column\">" );
			}
			if ( columnBreak > 0 && columnBreak === index ) {
				body.push( "</span><span class=\"charter-column right-column\">" );
			}
			body.push( `<span class="charter-section-wrapper"><span class="charter-section-title">${ section.title }</span>` );
			for( let i = 0; i < section.chords.length; i++ ) {
				if ( i > 0 ) body.push( "\n" );
				body.push( "<span class=\"charter-song-line\">" );
				for( let j = 0; j < section.chords[i].length; j++ ) {
					renderLyricLine( body, section.lyrics[i][j], section.chords[i][j], section.directions[i][j] );
				}
				body.push( "</span>" ); // charter-song-line
			}
			body.push( "</span>" ); // charter-section-wrapper
			if ( index !== chart.sections.length - 1 ) {
				body.push( "\n\n" );
			}

		} );
		if ( columnBreak > 0 ) {
			body.push( "</span>" ); // charter-column
		}
		body.push( "</pre>" ); // charter-song-body
	}
	chart.body = body.join( "" );
	const rendered = template( chart );
	return rendered;
}
