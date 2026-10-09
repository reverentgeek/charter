// Paths are relative to the built site (see tools/web.js), where src/ is published as lib/.
import { parse } from "./lib/chordpro.js";
import { render } from "./lib/html.js";
import { setMetadata, metadataFields } from "./lib/metadata.js";

const source = document.querySelector( "#source" );
const preview = document.querySelector( "#preview" );
const message = document.querySelector( "#message" );
const metadataForm = document.querySelector( "#metadata" );
const editorPane = document.querySelector( "#editor-pane" );
const fileInput = document.querySelector( "#file" );
const columnsToggle = document.querySelector( "#columns" );
const logoToggle = document.querySelector( "#logo" );
const printButton = document.querySelector( "#print" );
const downloadButton = document.querySelector( "#download" );

const renderDelay = 200;
let renderTimer;
let fileName = "";
let standaloneAssets;

function setReady( ready ) {
	printButton.disabled = !ready;
	downloadButton.disabled = !ready;
}

function showChart( html ) {
	// Replacing srcdoc reloads the frame, so put the reader back where they were.
	const scrollY = preview.contentWindow ? preview.contentWindow.scrollY : 0;
	preview.addEventListener( "load", () => preview.contentWindow.scrollTo( 0, scrollY ), { once: true } );
	preview.srcdoc = html;
}

// Fills the metadata form from the chart, leaving alone the field someone is typing in.
function syncForm( chart ) {
	for ( const name of metadataFields ) {
		const field = metadataForm.elements[name];
		const value = name === "artist" ? chart.artist.join( "\n" ) : chart[name];
		if ( field !== document.activeElement && field.value !== value ) {
			field.value = value;
		}
	}
}

function update() {
	clearTimeout( renderTimer );
	message.textContent = "";
	try {
		const chart = parse( source.value );
		syncForm( chart );
		if ( source.value.trim() === "" ) {
			showChart( "" );
			setReady( false );
			return;
		}
		showChart( render( chart, { columns: columnsToggle.checked, logo: logoToggle.checked ? undefined : false } ) );
		setReady( true );
	} catch ( err ) {
		console.error( err );
		message.textContent = "This chart could not be read. Check the ChordPro text and try again.";
		setReady( false );
	}
}

function scheduleUpdate() {
	clearTimeout( renderTimer );
	renderTimer = setTimeout( update, renderDelay );
}

function setSource( text, name = "" ) {
	source.value = text;
	fileName = name.replace( /\.[^.]+$/, "" );
	update();
}

async function openFile( file ) {
	if ( file ) {
		setSource( await file.text(), file.name );
	}
}

function readAsDataUrl( blob ) {
	return new Promise( ( resolve, reject ) => {
		const reader = new FileReader();
		reader.onload = () => resolve( reader.result );
		reader.onerror = () => reject( reader.error );
		reader.readAsDataURL( blob );
	} );
}

async function fetchOk( url ) {
	const res = await fetch( url );
	if ( !res.ok ) {
		throw new Error( `Unable to load ${ url } (${ res.status })` );
	}
	return res;
}

// A downloaded chart has no assets folder beside it, so the stylesheet and logo are embedded.
async function loadStandaloneAssets() {
	const [ css, logo ] = await Promise.all( [
		fetchOk( "./assets/styles.css" ).then( res => res.text() ),
		fetchOk( "./assets/logo.jpg" ).then( res => res.blob() ).then( readAsDataUrl )
	] );
	return { css, logo };
}

async function download() {
	try {
		standaloneAssets ??= await loadStandaloneAssets();
		const chart = parse( source.value );
		const html = render( chart, {
			columns: columnsToggle.checked,
			css: standaloneAssets.css,
			logo: logoToggle.checked ? standaloneAssets.logo : false
		} );
		const name = ( fileName || chart.title || "chart" ).replace( /[\\/:*?"<>|]+/g, " " ).trim();
		const link = document.createElement( "a" );
		link.href = URL.createObjectURL( new Blob( [ html ], { type: "text/html" } ) );
		link.download = `${ name }.html`;
		link.click();
		URL.revokeObjectURL( link.href );
	} catch ( err ) {
		console.error( err );
		message.textContent = "The chart could not be downloaded. Check your connection and try again.";
	}
}

source.addEventListener( "input", scheduleUpdate );
metadataForm.addEventListener( "input", ( e ) => {
	const scrollTop = source.scrollTop;
	source.value = setMetadata( source.value, e.target.name, e.target.value );
	source.scrollTop = scrollTop;
	scheduleUpdate();
} );
// Once a field is left, show it the way the chart reads it (trimmed, blank artist lines dropped).
metadataForm.addEventListener( "change", update );
metadataForm.addEventListener( "submit", e => e.preventDefault() );
columnsToggle.addEventListener( "change", update );
logoToggle.addEventListener( "change", update );
document.querySelector( "#open" ).addEventListener( "click", () => fileInput.click() );
fileInput.addEventListener( "change", async () => {
	await openFile( fileInput.files[0] );
	fileInput.value = "";
} );

document.querySelector( "#sample" ).addEventListener( "click", async () => {
	try {
		const res = await fetchOk( "./sample.cho" );
		setSource( await res.text() );
	} catch ( err ) {
		console.error( err );
		message.textContent = "The sample chart could not be loaded.";
	}
} );

document.querySelector( "#clear" ).addEventListener( "click", () => {
	setSource( "" );
	source.focus();
} );

editorPane.addEventListener( "dragover", ( e ) => {
	e.preventDefault();
	editorPane.classList.add( "dragging" );
} );
editorPane.addEventListener( "dragleave", () => editorPane.classList.remove( "dragging" ) );
editorPane.addEventListener( "drop", ( e ) => {
	e.preventDefault();
	editorPane.classList.remove( "dragging" );
	openFile( e.dataTransfer.files[0] );
} );

printButton.addEventListener( "click", () => {
	preview.contentWindow.focus();
	preview.contentWindow.print();
} );
downloadButton.addEventListener( "click", download );

update();
