import { convertChordProFilesToHtml } from "../src/processor.js";

const columns = process.argv.length > 2 && process.argv[2] === "--columns";
console.log( "columns:", columns );
convertChordProFilesToHtml( { columns } ).then( () => console.log( "rendered html files" ) );
