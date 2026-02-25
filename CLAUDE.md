# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chord Charter (`chord-charter`) is a Node.js CLI tool that converts ChordPro music notation files (`.chordpro`, `.cho`) into formatted HTML chord charts and renders them to PDF.

## Commands

```bash
npm test                    # Run tests with coverage (node:test + --experimental-test-coverage)
npm run lint                # ESLint with auto-fix
npm run build               # Clean + compile SCSS + generate HTML from charts/ folder
npm run build:columns       # Same as build but with two-column layout
npm run serve               # Dev server at localhost:3000 with file watching (nodemon)
npm run convert             # Full pipeline: build + render PDFs
npm run pdf                 # Render HTML files in build/ to PDF via Puppeteer
```

Run a single test file: `node --test tests/chordpro.test.js`

## Architecture

**Data flow:** ChordPro text -> parsed chart object -> HTML (via templates) -> PDF (via Puppeteer)

### Core modules (`src/`)

- **`chordpro.js`** - Regex-based parser. Exports `parse()`, `parseLyricLine()`, `parseSection()`. Produces a chart object with `{title, subtitle, artist[], key, tempo, time, sections[], footer[]}`.
- **`html.js`** - Renders parsed charts to HTML using EJS templates (`chart.ejs`). Pre-formatted layout with `<pre>` tags.
- **`htmlTableFormat.js`** - Alternative renderer using Handlebars (`chart.hbs`). Table-based layout.
- **`pdf.js`** - Renders HTML files to PDF using Puppeteer.
- **`processor.js`** - Orchestrates SCSS compilation and chart processing.
- **`cli.js`** - CLI execution: validates args, processes files/folders, coordinates the pipeline.
- **`sass/`** - SCSS stylesheets: `styles.scss` (main), `tablestyles.scss` (table format), `tablestyles-columns.scss` (two-column).

### Entry point

`bin/index.js` - CLI entry using yargs. Installed as `chord-charter` command.

### Build tooling (`tools/`)

Node.js scripts for clean, SCSS compilation, HTML generation, PDF rendering, and dev server. No bundler (webpack/rollup/vite).

### Key directories

- `charts/` - Input ChordPro files for local development
- `build/` - Generated HTML and CSS (gitignored)
- `pdf/` - Generated PDF files (gitignored)

## Code Style

- ESM modules (`"type": "module"`)
- ESLint flat config extending `eslint-config-reverentgeek` (node-esm preset)
- Spaces inside parentheses and brackets: `parse( text )`, `items[ 0 ]`
- Tabs for indentation
- Node.js >= 22.16.0, pnpm as package manager

## Testing

Tests use Node.js built-in `node:test` and `assert` modules. Test files are in `tests/` with `.test.js` suffix. Tests cover the ChordPro parser and both HTML renderers.
