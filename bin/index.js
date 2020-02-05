#!/usr/bin/env node
"use strict";

const yargs = require( "yargs" );
const cli = require( "../src/cli" );
const defaultPort = 8989;

const options = yargs
	.usage( "Usage: $0 -f path/to/chordpro [-o path/to/file-or-folder]" )
	.option( "f", { alias: "source", describe: "Path to file or folder of chordpro files to convert", type: "string", require: true } )
	.option( "o", { alias: "out", describe: "Path to destination file. If none specified, the file will be saved in the same path as the chordpro file.", type: "string" } )
	.option( "temp", { describe: "Specify path to temp folder for generating intermediate files.", type: "string" } )
	.option( "html", { describe: "Save as HTML instead of PDF", type: "boolean" } )
	.option( "columns", { describe: "Use two-column format", type: "boolean" } )
	.option( "p", { alias: "port", describe: "Internal HTTP port used to render PDF. Change if there is a conflict.", type: "number", default: defaultPort } ) 
	.option( "wk", { describe: "Use wkhtmltopdf utility to convert to PDF (must be in your path)", type: "boolean" } );

const config = options.argv;

if ( isNaN( config.port ) ) {
	config.port = defaultPort;
	config.p = defaultPort;
}

cli.execute( config )
	.then( () => console.log( "finished" ) )
	.catch( err => {
		// options.showHelp();
		console.log( err.message );
	} );
