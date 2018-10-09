const { DOMParser, XMLSerializer } = require('xmldom-sre');
const compile = require('../src');
const { readFileSync, writeFileSync } = require('fs');

const result = compile(readFileSync('component.html', 'utf-8'), {
	DOMParser,
	XMLSerializer
});

console.log(result);

writeFileSync('component_build.html', result, 'utf-8');
