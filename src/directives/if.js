const t = require('@babel/types');
const { default: template } = require('@babel/template');

const {
	createContext,
	getNode,
} = require('../context');
const compileNode = require('../compile-node');

module.exports = function compileAIf(node, parent, value, context) {
	node.removeAttribute('a-if');

	const getParentAst = getNode(parent, context)

	const newContext = createContext(context, node, parent, { enableCounter: true });
	const { newRoot, elementCounter, identifier } = newContext;

	const innerAst = compileNode.compileElementNode(node, newContext)

	const condition = template(`
		if (${value}){
			COUNTER += ${node.childNodes.length - }
			BODY
		} else {

		}
	`)({
		BODY: innerAst,
		COUNTER: elementCounter
	})

	const setupAst = newRoot
		? template.ast`
			const ${identifier} = ${getParentAst}
			let ${elementCounter} = ${t.numericLiteral(parent.childNodes.length)}
		`
		: [];

	return setupAst.concat(condition)
};
