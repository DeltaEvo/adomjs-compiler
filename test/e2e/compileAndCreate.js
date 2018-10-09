const compile = require('../../src');
//const { DOMParser, XMLSerializer } = require('xmldom-sre');
const { XMLSerializer } = require('w3c-xmlserializer');

module.exports = function compileAndCreate(template, name = 'test-element') {
	const result = compile(
		`
<template id="${name}">${template}</template>

<script>
window.customElements.define("${name}", @ATemplate("${name}") class extends HTMLElement { constructor(_) { return (_ = super(_)).init(), _; } });
</script>`,
		{ DOMParser, XMLSerializer: XMLSerializer.interface }
	);

	document.write(result.head.innerHTML);
	return document.createElement(name);
};
