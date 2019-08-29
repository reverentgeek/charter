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

const chartFolder = path.join( __dirname, "charts" );
const files = fs.readdirSync( chartFolder );
const chordFiles = files.filter( f => f.endsWith( ".cho" ) || f.endsWith( ".chordpro" ) );
chordFiles.forEach( cf => {
	const fileName = path.basename( cf, cf.endsWith( ".cho" ) ? ".cho" : ".chordpro" );
	const filePath = path.join( chartFolder, cf );
	const newFile = path.join( chartFolder, `${ fileName }.html` );
	console.log( filePath );
	console.log( newFile );
	parseChordFile( filePath, newFile );
} );
