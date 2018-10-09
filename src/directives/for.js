const t = require('@babel/types');
const { default: template } = require('@babel/template');

const { createContext, getNode, CHILD_NODES, DOCUMENT } = require('../context');
const compileNode = require('../compile-node');

module.exports = function compileAFor(node, parent, index, value, context) {
	const id = node.getAttribute('id');
	node.removeAttribute('a-for');

	const templateIdentifier = t.identifier(id.replace('-', '_'));
	const parentAst = getNode(parent, context);

	const newContext = createContext(context, node, parent, {
		getNodeOverride(node, { root, identifier, elementCounter }) {
			if (node.parentNode === root.content) {
				const numeric = t.numericLiteral(NaN);
				const pos = Array.from(node.parentNode.childNodes).indexOf(node);

				// Push as hook because `childNodes.length` can change if for example an element is removed or moved (like a template)
				context.hooks.push(
					() => (numeric.value = node.parentNode.childNodes.length - pos)
				);
				return template.ast`${identifier}[${CHILD_NODES}][${elementCounter} - ${numeric}]`
					.expression;
			}
		},
		enableCounter: true
	});

	const { identifier, elementCounter, ownerDocument, newRoot } = newContext;

	const innerAst = compileNode.compileElementNode(node, newContext);
	const sibblingCount = t.numericLiteral(NaN);

	context.hooks.push(() => (sibblingCount.value = parent.childNodes.length));

	const loop = template(`
		for(let ${value})
			BODY
	`)({
		BODY: template.ast`
			${elementCounter} += ${t.numericLiteral(node.content.childNodes.length)}
			if (${elementCounter} > ${identifier}[${CHILD_NODES}].length - ${sibblingCount})
				${identifier}.insertBefore(${DOCUMENT}.importNode(${templateIdentifier}.content, true), ${identifier}[${CHILD_NODES}][${elementCounter} - ${t.numericLiteral(
			node.content.childNodes.length
		)}]);
			${innerAst}
		`
	});

	const setupAst = newRoot
		? template.ast`
			const ${identifier} = ${parentAst}
			let ${elementCounter} = ${t.numericLiteral(index)}
		`
		: [];

	// Only the one that created the root clean the elements
	const cleanAst = newRoot
		? template.ast`
			while(${identifier}[${CHILD_NODES}].length - ${sibblingCount} > ${elementCounter})
				${identifier}.removeChild(${identifier}[${CHILD_NODES}][${elementCounter}])
		`
		: [];

	return template.ast`
		const ${templateIdentifier} = ${ownerDocument}.getElementById(${t.stringLiteral(
		node.getAttribute('id')
	)})
		${setupAst}
		${loop}
		${cleanAst}
	`;
};
