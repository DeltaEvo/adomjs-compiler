const t = require('@babel/types');
const { default: template } = require('@babel/template');

const {
	createContext,
	moveTemplate,
	getNode,
	CHILD_NODES,
	DOCUMENT
} = require('../context');
const compileNode = require('../compile-node');

module.exports = function compileAFor(node, value, context) {
	const parent = node.parentNode;

	node.removeAttribute('a-for');
	const tId = moveTemplate(node, context);

	const templateIdentifier = t.identifier(tId);

	const { elementCounters, ownerDocument } = context;

	const parentAst = getNode(parent, context);

	// If parent is just an identifier newRoot = oldRoot;
	// Get counter of parent
	const createCounter = !t.isIdentifier(parentAst);

	const counter = createCounter
		? t.identifier(`_c${context.counters.i++}`)
		: elementCounters.get(parentAst);

	const newContext = createContext(
		context,
		node,
		(node, { root, identifier }) => {
			if (node.parentNode === root) {
				const numeric = t.numericLiteral(NaN);
				const pos = Array.from(node.parentNode.childNodes).indexOf(node);

				// Push as hook because `childNodes.length` can change if for example an element is removed or moved (like a template)
				context.hooks.push(
					() => (numeric.value = node.parentNode.childNodes.length - pos)
				);
				return template.ast`${identifier}[${CHILD_NODES}][${counter} - ${numeric}]`
					.expression;
			}
		}
	);

	const { identifier } = newContext;

	elementCounters.set(identifier, counter);

	const innerAst = compileNode.compileChilds(node, newContext);

	const loop = template(`
		for(let ${value})
			BODY
	`)({
		BODY: template.ast`
			${counter} += ${t.numericLiteral(node.childNodes.length)}
			if (${counter} > ${identifier}[${CHILD_NODES}].length)
				${identifier}.appendChild(${DOCUMENT}.importNode(${templateIdentifier}.content, true));
			${innerAst}
		`
	});

	const counterAst = createCounter
		? template.ast`
			let ${counter} = ${t.numericLiteral(parent.childNodes.length)}
		`
		: [];

	// Only the one that created the counter clean the elements
	const cleanAst = createCounter
		? template.ast`
			while(${identifier}[${CHILD_NODES}].length > ${counter})
				${identifier}.removeChild(${identifier}[${CHILD_NODES}][${counter}])
		`
		: [];

	return template.ast`
		const ${identifier} = ${parentAst}
		const ${templateIdentifier} = ${ownerDocument}.getElementById(${t.stringLiteral(
		tId
	)})
		${counterAst}
		${loop}
		${cleanAst}
	`;
};
