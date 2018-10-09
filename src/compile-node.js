const { default: template } = require('@babel/template');

const { getNode, moveTemplate, oldParent, oldIndex } = require('./context');
const directives = require('./directives');
const { ELEMENT_NODE, TEXT_NODE, COMMENT_NODE } = require('./utils/constants');

const INVISIBLE_CHAR = '\u200c';

function compileNode(node, context) {
	switch (node.nodeType) {
		case ELEMENT_NODE:
			return compileElementNode(node, context);
		case TEXT_NODE:
			return compileTextNode(node, context);
		case COMMENT_NODE:
			return [];
		default:
			throw new Error(`Unsuported type ${node.nodeType}`);
	}
}

function compileElementNode(node, context) {
	if (node.hasAttributes()) {
		for (const name in directives) {
			if (node.hasAttribute(name)) {
				if (node.tagName.toLowerCase() === 'template')
					moveTemplate(node, context);
				return directives[name](
					node,
					node[oldParent] || node.parentNode,
					oldIndex in node
						? node[oldIndex]
						: Array.from(node.parentNode.childrens || []).indexOf(node),
					node.getAttribute(name),
					context
				);
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
	const { childNodes } = node.content || node;
	if (childNodes) {
		return Array.from(childNodes).reduce(
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
