const parser = require('@babel/parser');
const { default: traverse } = require('@babel/traverse');
const t = require('@babel/types');
const { default: generate } = require('@babel/generator');
const { default: template } = require('@babel/template');
const assert = require('assert');

const createSetState = require('./set-state');

module.exports = function compile(
	input,
	{ DOMParser = window.DOMParser, XMLSerializer = window.XMLSerializer }
) {
	const doc = new DOMParser().parseFromString(input);
	for (const script of Array.from(doc.getElementsByTagName('script'))) {
		const ast = parser.parse(script.textContent, {
			plugins: [
				['decorators', { decoratorsBeforeExport: true }],
				'objectRestSpread'
			]
		});

		traverse(ast, {
			Decorator(path) {
				const { arguments: args, callee } = path.node.expression;
				if (t.isIdentifier(callee) && callee.name === 'ATemplate') {
					assert(args.length === 1 && t.isStringLiteral(args[0]));
					const id = args[0].value;

					transformClass(path.parentPath, id, doc);

					path.remove();
				}
			}
		});

		script.textContent = `\n${generate(ast).code}\n`;
	}

	return new XMLSerializer().serializeToString(doc);
};

function transformClass(clazz, id, doc) {
	const element = doc.getElementById(id);
	const methods = clazz.get('body.body');

	const constructor =
		methods.find(
			({
				node: {
					key: { name }
				}
			}) => name == 'constructor'
		) ||
		clazz
			.get('body')
			.unshiftContainer(
				'body',
				t.classMethod(
					'constructor',
					t.identifier('constructor'),
					[],
					t.blockStatement([])
				)
			);

	// If super is not the first call
	if (!constructor.get('body.body.0.expression.callee').isSuper()) {
		constructor.get('body').unshiftContainer('body', template.ast`super()`);
	}

	const ownerDocument = getOwnerDocument(clazz);

	attachShadow(constructor, ownerDocument, id);

	createSetState(clazz, element, ownerDocument, id);
}

function getOwnerDocument(clazz) {
	const ownerDocument = clazz.parentPath.scope.generateUidIdentifier('oDoc');

	clazz.insertBefore(template.ast`
		const ${ownerDocument} = document.currentScript.ownerDocument
	`);

	return ownerDocument;
}

function attachShadow(constructor, ownerDocument, id) {
	constructor.get('body.body.0').insertAfter(template.ast`
		this.attachShadow({mode: "open"})
			.appendChild(
				document.importNode(
					${ownerDocument}.getElementById(${t.stringLiteral(id)}).content,
					true
				)
			)
	`);
}
