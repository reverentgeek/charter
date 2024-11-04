#!/usr/bin/env node
import { execute } from "../src/cli.js";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const config = yargs( hideBin( process.argv ) )
	.usage( "Usage: $0 -f path/to/chordpro [-o path/to/file-or-folder]" )
	.option( "f", { alias: "source", describe: "Path to file or folder of chordpro files to convert", type: "string", require: true } )
	.option( "o", { alias: "out", describe: "Path to destination file. If none specified, the file will be saved in the same path as the chordpro file.", type: "string" } )
	.option( "temp", { describe: "Specify path to temp folder for generating intermediate files.", type: "string" } )
	.option( "html", { describe: "Save as HTML instead of PDF", type: "boolean" } )
	.option( "columns", { describe: "Use two-column format", type: "boolean" } )
	.parse();

console.log( config );
execute( config )
	.then( () => console.log( "finished" ) )
	.catch( err => {
		// options.showHelp();
		console.log( err.message );
	} );

