"use strict";

const fs = require( "fs-extra" );
const ejs = require( "ejs" );
const path = require( "path" );
let _template;

async function getChartTemplate() {
	if ( !_template ) {
		const text = await fs.readFile( path.join( __dirname, "chart.ejs" ), "utf8" );
		_template = ejs.compile( text );
	}
	return _template;
}

function formatChord( chord ) {
	if ( chord.length <= 1 || chord === "N.C." ) {
		return chord;
	}
	const chords = chord.split( "/" );
	const formatted = chords.map( c => {
		const [ note, ...parts ] = c.split( /(^[b#]{0,1}[A-G1-7]{1}[#♯b♭]{0,1}(?:maj|dim|sus|m|aug|Maj){0,1})/g ).filter( p => p.length > 0 );
		return parts.length > 0 ? `${ note }<sup>${ parts.join( "" ) }</sup>` : note;
	} );
	return formatted.length > 1 ? formatted.join( "/" ) : formatted[0];
}

const renderLyricLine = ( body, lyric, chord ) => {
	if ( chord ) {
		body.push( `<span class="${ chord.startsWith( "(" ) ? "charter-direction-wrapper" : "chord-wrapper" }">` );
		body.push( `<span class="${ chord.startsWith( "(" ) ? "charter-direction" : "chord" }">${ formatChord( chord ) }</span>` );
		body.push( `<span class="chord-lyrics">${ lyric.length > 0 ? lyric : " " }</span>` );
		body.push( "</span>" );
		if ( lyric.trim() === "" ) body.push( "    " );
	} else {
		body.push( lyric );
	}
};

async function render( chart, options = { columns: false } ) {
	const template = await getChartTemplate();
	chart.columns = options.columns;

	const body = [];
	if ( chart.sections.length > 0 ) {
		body.push( "<pre class=\"charter-song-body\">" );
		chart.sections.forEach( section => {
			body.push( `<span class="charter-comment">${ section.title }</span>` );
			for( let i = 0; i < section.chords.length; i++ ) {
				if ( i > 0 ) body.push( "\n" );
				body.push( "<span class=\"charter-song-line\">" );
				for( let j = 0; j < section.chords[i].length; j++ ) {
					renderLyricLine( body, section.lyrics[i][j].replace( "\r", "" ), section.chords[i][j] );
				}
				body.push( "</span>" ); // charter-song-line
			}
			body.push( "</span>\n\n" ); // charter-song-section

		} );
		body.push( "</pre>" ); // charter-song-body
	}
	chart.body = body.join( "" );
	const rendered = template( chart );
	return rendered;
}

module.exports = {
	formatChord,
	render
};
