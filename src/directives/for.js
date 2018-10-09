const t = require('@babel/types');
const { default: template } = require('@babel/template');

const {
	createContext,
	getNode,
	setup,
	CHILD_NODES,
	DOCUMENT
} = require('../context');
const compileNode = require('../compile-node');

module.exports = function compileAFor(node, parent, index, value, context) {
	const id = node.getAttribute('id');
	node.removeAttribute('a-for');

	const templateIdentifier = t.identifier(id.replace('-', '_'));
	const parentAst = getNode(parent, context);

	const { context: newContext, new: newIds } = createContext(
		context,
		node,
		parent,
		{
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
		}
	);

	const { identifier, elementCounter, ownerDocument } = newContext;

	const innerAst = compileNode.compileElementNode(node, newContext);
	const sibblingAfterCount = t.numericLiteral(NaN);

	context.hooks.push(
		() => (sibblingAfterCount.value = parent.childNodes.length - index)
	);

	const increment = t.numericLiteral(node.content.childNodes.length);

	const loop = template(`
		for(let ${value})
			BODY
	`)({
		BODY: template.ast`
			${elementCounter} += ${increment}
			if (${elementCounter} > ${identifier}[${CHILD_NODES}].length - ${sibblingAfterCount})
				${identifier}.insertBefore(${DOCUMENT}.importNode(${templateIdentifier}.content, true), ${identifier}[${CHILD_NODES}][${elementCounter} - ${increment}]);
			${innerAst}
		`
	});

	// Only the one that created the counter clean the elements
	const cleanAst = newIds.counter
		? template.ast`
			while(${identifier}[${CHILD_NODES}].length - ${sibblingAfterCount} > ${elementCounter})
				${identifier}.removeChild(${identifier}[${CHILD_NODES}][${elementCounter}])
		`
		: [];

	return template.ast`
		const ${templateIdentifier} = ${ownerDocument}.getElementById(${t.stringLiteral(
		node.getAttribute('id')
	)})
		${setup(newIds, newContext, parentAst, index)}
		${loop}
		${cleanAst}
	`;
};
