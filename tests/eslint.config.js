import rg from "eslint-config-reverentgeek";

export default [
	...rg.configs[ "node-esm" ],
	{
		"plugins": ["jest"]
	}
];
