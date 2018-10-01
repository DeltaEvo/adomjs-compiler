const t = require('@babel/types');
const { default: template } = require('@babel/template');

const {
	createContext,
	getNode,
	CHILD_NODES,
	DOCUMENT
} = require('../context');
const compileNode = require('../compile-node');

module.exports = function compileAFor(node, parent, value, context) {
	node.removeAttribute('a-for');

	const templateIdentifier = t.identifier(node.getAttribute('id'));
	const parentAst = getNode(parent, context);

	const newContext = createContext(
		context,
		node,
		parent,
		{
			getNodeOverride(node, { root, identifier }) {
				if (node.parentNode === root) {
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
		}
	);

	const { identifier, elementCounter, ownerDocument, newRoot } = newContext;

	const innerAst = compileNode.compileElementNode(node, newContext);

	const loop = template(`
		for(let ${value})
			BODY
	`)({
		BODY: template.ast`
			${elementCounter} += ${t.numericLiteral(node.childNodes.length)}
			if (${elementCounter} > ${identifier}[${CHILD_NODES}].length)
				${identifier}.appendChild(${DOCUMENT}.importNode(${templateIdentifier}.content, true));
			${innerAst}
		`
	});

	const setupAst = newRoot
		? template.ast`
			const ${identifier} = ${parentAst}
			let ${elementCounter} = ${t.numericLiteral(parent.childNodes.length)}
		`
		: [];
	
	const sibblingCount = t.numericLiteral(NaN);

	context.hooks.push(
		() => (sibblingCount.value = parent.childNodes.length)
	);

	// Only the one that created the root clean the elements
	const cleanAst = newRoot
		? template.ast`
			while(${identifier}[${CHILD_NODES}].length > ${elementCounter} + ${sibblingCount})
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
