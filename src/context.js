const t = require('@babel/types');

const CHILD_NODES = t.identifier('_');
const DOCUMENT = t.identifier('_doc');
const TEXT_NODE = 3;

function createContext(
	{
		ownerDocument,
		nextSibling,
		templateId,
		elementCounters = new WeakMap(),
		hooks = [],
		counters = { i: 0, tId: 0, rId: 0 }
	},
	root,
	getNodeOverride
) {
	return {
		identifier: t.identifier(`_r${counters.rId++}`),
		root,
		ownerDocument,
		hooks,
		elementCounters,
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
	else
		return t.memberExpression(
			t.memberExpression(getNode(node.parentNode, context), CHILD_NODES, true),
			t.numericLiteral(Array.from(node.parentNode.childNodes).indexOf(node)),
			true
		);
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

function moveTemplate(elem, context) {
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
	return eId;
}

Object.assign(exports, {
	CHILD_NODES,
	DOCUMENT,
	createContext,
	getNode,
	moveTemplate
});
