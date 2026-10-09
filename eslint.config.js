import { defineConfig, globalIgnores } from "eslint/config"; // eslint-disable-line n/no-unpublished-import
import rg from "eslint-config-reverentgeek"; // eslint-disable-line n/no-unpublished-import

export default defineConfig( [
	globalIgnores( [ "dist/" ] ),
	{
		extends: [ rg.configs["node-esm"] ],
		rules: {
		}
	},
	{
		// Browser code for the web app; its imports resolve in the built site, not in web/
		files: [ "web/**/*.js" ],
		languageOptions: {
			globals: {
				document: "readonly",
				fetch: "readonly",
				Blob: "readonly",
				URL: "readonly",
				FileReader: "readonly",
				console: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly"
			}
		},
		rules: {
			"n/no-missing-import": "off",
			"n/no-unsupported-features/node-builtins": "off"
		}
	}
] );
