import fs from "fs-extra";
import { join } from "node:path";
import hb from "handlebars";

let _template;
const chordRegEx = /^(?<flatted>[b#]{0,1})(?<root>[A-G1-7][#♯b♭]?(m(?!aj)|maj)?)(?<quality>(2|3|4|5|6|7|9|\(|\)|no|o|\+|add|dim|sus|aug){0,5})$/;

async function getChartTemplate() {
	if ( !_template ) {
		const __dirname = import.meta.dirname;
		const chartFile = join( __dirname, "chart.hbs" );
		const text = await fs.readFile( chartFile, "utf8" );
		_template = hb.compile( text );
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

export function renderChart( chart, options = { columns: false } ) {
	const header = [];
	const body = [];
	const footer = [];

	if ( chart.title ) {
		header.push( `<h1 class="charter-title">${ chart.title }</h1>` );
	}

	chart.artist.forEach( artist => header.push( `<h2 class="charter-artist">${ artist }</h2>` ) );

	if ( chart.subtitle ) {
		header.push( `<h2 class="charter-subtitle">${ chart.subtitle }</h2>` );
	}

	const keyLine = [];
	if ( chart.key ) {
		keyLine.push( `Key: ${ chart.key }` );
	}
	if ( chart.tempo ) {
		keyLine.push( `Tempo: ${ chart.tempo }` );
	}
	if ( chart.time ) {
		keyLine.push( `Time: ${ chart.time }` );
	}
	if ( keyLine.length > 0 ) {
		header.push( `<h2 class="charter-key">${ keyLine.join( " | " ) }</h2>` );
	}

	if ( chart.sections.length > 0 ) {
		body.push( "<div class=\"charter-body\">" );
		chart.sections.forEach( section => {
			body.push( "<div class=\"charter-section\">" );
			body.push( `<div class="charter-section-title">${ section.title }</div>` );
			body.push( "<div class=\"charter-section-body\">" );
			for( let i = 0; i < section.chords.length; i++ ) {
				body.push( "<table class=\"charter-chart\">" );
				body.push( "<tr class=\"charter-chords\">" );
				for( let j = 0; j < section.chords[i].length; j++ ){
					if ( section.chords[i][j].length > 0 ) {
						body.push( `<td class="charter-chord">${ formatChord( section.chords[i][j] ) }</td>` );
					}
					if ( section.directions[i][j].length > 0 ) {
						body.push( `<td class="charter-section-title">${ section.directions[i][j] }</td>` );
					}
					// body.push( section.chords[i][j].startsWith( "(" ) ? `<td class="charter-section-title">${ section.chords[i][j] }</td>` : `<td class="charter-chord">${ formatChord( section.chords[i][j] ) }</td>` );
				}
				body.push( "</tr>" );
				body.push( "<tr class=\"charter-lyrics\">" );
				for( let j = 0; j < section.lyrics[i].length; j++ ){
					body.push( `<td class="charter-lyric">${ section.lyrics[i][j] }</td>` );
				}
				body.push( "</tr>" );
				body.push( "</table>" );
			}
			body.push( "</div>" ); // section body
			body.push( "</div>" ); // section

		} );
		body.push( "</div>" ); // charter-body
	}

	if ( chart.footer.length > 0 ) {
		footer.push( "<div class=\"charter-footer\">" );
		chart.footer.forEach( f => {
			footer.push( `<div class="charter-footer-line">${ f }</div>` );
		} );
		footer.push( "</div>" );
	}
	chart.footer.forEach;

	return {
		header: header.join( "\n" ),
		body: body.join( "\n" ),
		footer: footer.join( "\n" ),
		columns: options.columns
	};
}

export async function render( chart, options = { columns: false } ) {
	const template = await getChartTemplate();
	const chartHtml = renderChart( chart, options );
	return template( chartHtml );
}
