"use strict";

const processor = require( "../src/processor" );

processor.convertChordProFilesToHtml().then( () => console.log( "rendered html files" ) );
