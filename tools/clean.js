"use strict";

const fs = require( "fs-extra" );
const path = require( "path" );

const buildFolder = path.join( __dirname, "..", "build" );
const pdfFolder = path.join( __dirname, "..", "pdf" );
fs.emptyDir( pdfFolder );
fs.emptyDir( buildFolder );
fs.ensureDir( path.join( buildFolder, "css" ) );
