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
npm run convert             # Full pipeline: build + render PDFs
npm run pdf                 # Render HTML files in build/ to PDF via Puppeteer
```

Run a single test file: `node --test tests/chordpro.test.js`

## Architecture

**Data flow:** ChordPro text -> parsed chart object -> HTML (via templates) -> PDF (via Puppeteer)

There are **two independent HTML renderers** off the same parsed chart: `src/html.js` (EJS, `<pre>`-based pre-formatted layout) and `src/htmlTableFormat.js` (Handlebars, table-based). They are not interchangeable — a change to chart output usually needs to land in both.

No bundler (webpack/rollup/vite); `tools/` holds plain Node scripts for the build steps.

## Code Style

- ESM modules (`"type": "module"`)
- ESLint flat config extending `eslint-config-reverentgeek` (node-esm preset)
- Spaces inside parentheses and brackets: `parse( text )`, `items[ 0 ]`
- Tabs for indentation
- Node.js >= 22.16.0, pnpm as package manager
