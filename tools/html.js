"use strict";

const processor = require( "../src/processor" );
const columns = process.argv.length > 2 && process.argv[2] === "--columns";
console.log( "columns:", columns );
processor.convertChordProFilesToHtml( { columns } ).then( () => console.log( "rendered html files" ) );
