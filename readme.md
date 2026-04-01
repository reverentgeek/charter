# Charter

Turns `.chordpro` files into formatted HTML chord charts and renders them to PDF.

Turn something like this...

![chordpro sample](./docs/chordpro-sample.jpg)

...into something like this!

![Chart sample](./docs/chart-sample.jpg)

## Requirements

To use this application, you will need the current LTS version of [Node.js](https://nodejs.org/).

## Setup

1. Clone or download and unzip the source code.
2. Open your terminal or command prompt and change to the source code folder.
3. Install dependencies

```sh
npm install
```

### Installing the Command-Line Interface (CLI)

The charter application can be installed as a command-line interface (CLI) app that can be used anywhere in your terminal or command prompt.

```sh
npm install -g .
```

This will install the `chord-charter` CLI app.

## Usage

You can use this application to view `.chordpro` files as HTML in the browser and convert them to PDF. A sample ChordPro file is included in the source code.

## Command Line Interface (CLI)

Converting a single ChordPro file to PDF. By default, the `.pdf` file will be saved in the same folder as the ChordPro file.

```sh
chord-charter -f path/to/chartfile.chordpro
```

Specifying the output file.

```sh
chord-charter -f path/to/chartfile.chordpro -o path/to/chordchart.pdf
```

Converting a folder of chordpro files at once. The folder will be scanned for any files ending with a `.chordpro` or `.cho` extension.

```sh
chord-charter -f path/to/chartfiles -o path/to/savepdfs
```

|Option|Description|
|:---|:---|
|`--help`|Show help|
|`--version`|Show version number|
|`-f`, `--source`|Path to file or folder of chordpro files to convert|
|`-o`, `--out`|Path to destination file. If none specified, the file will be saved in the same path as the chordpro file.|
|`--temp`|Specify path to the temp folder for generating intermediate files.|
|`--html`|Save as HTML instead of PDF|
|`--columns`|Use two-column format (doesn't work well with all charts)|

## Advanced Usage

### Converting ChordPro files to PDF

Put your `.chordpro` files in the `charts` folder and run in your terminal:

```sh
npm run start
```

HTML files will be generated in the `build` folder, and PDF files can be found in the `pdf` folder.

### Viewing ChordPro files as HTML

Put your `.chordpro` files in the `charts` folder and run the following in your terminal to build the HTML files.

```sh
npm run build
```

HTML files will be generated in the `build` folder. Open them in your browser to preview.
