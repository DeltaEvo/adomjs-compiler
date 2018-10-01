const t = require('@babel/types');
const { TEXT_NODE } = require('./utils/constants')

const CHILD_NODES = t.identifier('_');
const DOCUMENT = t.identifier('_doc');

const __meta__ = Symbol("__meta__")

function createContext(
	{
		ownerDocument,
		nextSibling,
		templateId,
		elementCounter: oldElementCounter,
		hooks = [],
		counters = { i: 0, tId: 0, rId: 0 }
	},
	root,
	parent,
	{
		enableCounter = false,
		getNodeOverride
	} = {}
) {

	const newRoot = !(parent && __meta__ in parent && parent[__meta__].identifier);
	const identifier = newRoot ? t.identifier(`_r${counters.rId++}`) : parent[__meta__].identifier;
	const elementCounter = newRoot ? (enableCounter ? t.identifier(`_c${counters.i++}`) : null) : oldElementCounter
	const newMeta = {
		identifier,
		elementCounter
	}
	if (parent)
		parent[__meta__] = newMeta;
	root[__meta__] = newMeta;
	return {
		identifier: identifier,
		newRoot,
		root,
		ownerDocument,
		hooks,
		elementCounter,
		nextSibling,
		templateId,
		getNodeOverride,
		counters
	};
}

function getNode(node, context) {
	if (context.getNodeOverride) {
		const res = context.getNodeOverride(node, context);
		if (res) return res;
	}
	if (node === context.root) return context.identifier;
	else if (__meta__ in node) return node[__meta__].identifier;
	else {
		let numAst = t.numericLiteral(Array.from(node.parentNode.childNodes).indexOf(node))
		if (node.parentNode && __meta__ in node.parentNode && node.parentNode[__meta__].elementCounter) {
			const counter = node.parentNode[__meta__].elementCounter;
			if (numAst.value === 0)
				numAst = counter;
			else
				numAst = t.binaryExpression("+", counter, numAst);
		}
		return t.memberExpression(
			t.memberExpression(getNode(node.parentNode, context), CHILD_NODES, true),
			numAst,
			true
		);
	}
}

function mergeTextNodes(elem) {
	if (elem.childNodes.length)
		Array.from(elem.childNodes).reduce((last, el) => {
			if (last.nodeType === TEXT_NODE && el.nodeType === TEXT_NODE) {
				el.data = last.data + el.data;
				elem.removeChild(last);
			}
			return el;
		});
}

const oldParent = Symbol("oldParent")

function moveTemplate(elem, context) {
	if (oldParent in elem) {
		// Already moved
		return
	}

	const eId = `${context.templateId}$${context.counters.tId++}`;
	const parent = elem.parentNode;
	parent.removeChild(elem);
	elem.ownerDocument.insertBefore(elem, context.nextSibling);
	elem.ownerDocument.insertBefore(
		elem.ownerDocument.createTextNode('\n'),
		elem
	);
	mergeTextNodes(parent);
	elem.setAttribute('id', eId);
	elem[oldParent] = parent;
}

Object.assign(exports, {
	CHILD_NODES,
	DOCUMENT,
	createContext,
	getNode,
	moveTemplate,
	oldParent
});
