const { default: template } = require('@babel/template');

const { getNode } = require('./context');
const directives = require('./directives');

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const INVISIBLE_CHAR = '\u200c';

function compileNode(node, context) {
	switch (node.nodeType) {
		case ELEMENT_NODE:
			return compileElementNode(node, context);
		case TEXT_NODE:
			return compileTextNode(node, context);
	}
}

function compileElementNode(node, context) {
	if (node.attributes) {
		for (const { name, value } of Array.from(node.attributes)) {
			if (name in directives) {
				return directives[name](node, value, context);
			}
		}
	}
	return compileChilds(node, context);
}

function compileTextNode(node, context) {
	const data = node.data.trim();

	if (data.startsWith('{{') && data.endsWith('}}')) {
		const inner = data.slice(2, -2);
		node.data = INVISIBLE_CHAR;
		return template.ast`
				${getNode(node, context)}.data = ${template.ast(inner).expression};
		`;
	} else return [];
}

function compileChilds(node, context) {
	if (node.childNodes) {
		return Array.from(node.childNodes).reduce(
			(ast, child) => ast.concat(compileNode(child, context)),
			[]
		);
	}
}

Object.assign(exports, {
	compileNode,
	compileElementNode,
	compileTextNode,
	compileChilds
});
