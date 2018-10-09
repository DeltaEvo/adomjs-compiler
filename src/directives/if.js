const t = require('@babel/types');
const { default: template } = require('@babel/template');

const { createContext, getNode, setup } = require('../context');
const compileNode = require('../compile-node');

module.exports = function compileAIf(node, parent, index, value, context) {
	node.removeAttribute('a-if');

	const getParentAst = getNode(parent, context);

	const { context: newContext, new: newIds } = createContext(
		context,
		node,
		parent,
		{
			enableCounter: true
		}
	);

	const { elementCounter, identifier } = newContext;

	const innerAst = compileNode.compileElementNode(node, newContext);

	const condition = template(`
		if (${value}){
			COUNTER += ${node.childNodes.length}
			BODY
		} else {

		}
	`)({
		BODY: innerAst,
		COUNTER: elementCounter
	});

	return setup(newIds, newContext, getParentAst, index).concat(condition);
};
