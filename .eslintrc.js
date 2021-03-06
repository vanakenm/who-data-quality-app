module.exports = {
    "env": {
        "browser": true,
        "es6": true
	},
    "extends": "eslint:recommended",
    "parserOptions": {
		"sourceType": "module",
		"ecmaFeatures": {
			"experimentalObjectRestSpread": true
		}
    },
    "rules": {
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		],
		"no-console": "off"
	},
	"globals": {
		"angular": true,
		"require": true,
		"d3": true
	}
};
