const chordpro = require( "chordprojs" );
const fs = require( "fs" );
const path = require( "path" );
const hb = require( "handlebars" );
let __template;

const getChartTemplate = () => {
	if ( __template ) {
		return __template;
	}
	const text = fs.readFileSync( path.join( __dirname, "chart.hbs" ), "utf8" );
	__template = hb.compile( text );
	return __template;
};

const parseChordFile = ( chordFile, htmlFile ) => {
	const text = fs.readFileSync( chordFile, "utf8" );
	const song = chordpro.parse( text );
	const chart = song.render();
	const template = getChartTemplate();
	const html = template( { body: chart } );
	fs.writeFileSync( htmlFile, html, { encoding: "utf8" } );
};

const files = fs.readdirSync( __dirname );
const chordFiles = files.filter( f => { return f.indexOf( ".chordpro" ) > -1; } );
chordFiles.forEach( cf => {
	const filePath = path.join( __dirname, cf );
	const fileName = path.basename( filePath, ".chordpro" );
	const newFile = path.join( __dirname, `${fileName}.html` );
	parseChordFile( filePath, newFile );
} );
