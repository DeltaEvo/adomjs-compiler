const t = require('@babel/types');
const { TEXT_NODE } = require('./utils/constants');

const CHILD_NODES = t.identifier('_');
const DOCUMENT = t.identifier('_doc');

const METAS = new WeekMap();

function createContext(
	{
		ownerDocument,
		nextSibling,
		templateId,
		hooks = [],
		counters = { cId: 0, tId: 0, rId: 0 }
	},
	root,
	parent,
	{ enableCounter = false, getNodeOverride } = {}
) {
	const meta = METAS.get(parent)

	const identifier = (meta && meta.identifier) || t.identifier(`_r${counters.rId++}`)

	const elementCounter = enableCounter && ((meta && meta.counter) || t.identifier(`_c${counters.cId++}`))

	const newMeta = {
		identifier,
		counter: elementCounter
	}

	if (parent) METAS.set(parent, newMeta)
	if (root.content) METAS.set(root.content, newMeta)
	METAS.set(root, newMeta)

	return {
		context: {
			identifier,
			root,
			ownerDocument,
			hooks,
			elementCounter,
			nextSibling,
			templateId,
			getNodeOverride,
			counters
		},
		new: {
			counter: enableCounter && !(meta && meta.counter),
			identifier: !(meta && meta.identifier)
		}
	}
}

function setup({ counter: newCounter, identifier: newIdentifier }, { elementCounter, identifier }, identifierAssignment, counterIndex) {
	const ast = [];
	if (newIdentifier)
		ast.push(t.variableDeclaration("const", [t.variableDeclarator(identifier, identifierAssignment)]))
	if (newCounter)
		ast.push(t.variableDeclaration("let", [t.variableDeclarator(elementCounter, t.numericLiteral(counterIndex))]))
	return ast;
}

function getNode(node, context) {
	if (context.getNodeOverride) {
		const res = context.getNodeOverride(node, context);
		if (res) return res;
	}
	if (node === context.root || node === context.root.content)
		return context.identifier;
	else if (METAS.has(node)) return METAS.get(node).identifier;
	else {
		let numAst = t.numericLiteral(
			Array.from(node.parentNode.childNodes).indexOf(node)
		);
		const parentMeta = node.parentNode && METAS.get(node.parentNode)
		if (
			parentMeta && parentMeta.counter
		) {
			const counter = parentMeta.counter;
			if (numAst.value === 0) numAst = counter;
			else numAst = t.binaryExpression('+', counter, numAst);
		}
		return t.memberExpression(
			t.memberExpression(getNode(node.parentNode, context), CHILD_NODES, true),
			numAst,
			true
		);
	}
}

function mergeTextNodes(elem) {
	const { childNodes } = elem.content || elem;
	if (childNodes.length)
		Array.from(childNodes).reduce((last, el) => {
			if (last.nodeType === TEXT_NODE && el.nodeType === TEXT_NODE) {
				el.data = last.data + el.data;
				elem.removeChild(last);
			}
			return el;
		});
}

const oldParent = Symbol('oldParent');
const oldIndex = Symbol('oldIndex');

function moveTemplate(elem, context) {
	if (oldParent in elem) {
		// Already moved
		return;
	}

	const eId = `${context.templateId}$${context.counters.tId++}`;
	const parent = elem.parentNode;
	elem[oldIndex] = Array.from(elem.parentNode.childNodes).indexOf(elem);
	if (
		elem.previousSibling &&
		elem.previousSibling.nodeType === TEXT_NODE &&
		(elem.nextSibling && elem.nextSibling.nodeType === TEXT_NODE)
	)
		elem[oldIndex]--;
	parent.removeChild(elem);
	context.nextSibling.parentNode.insertBefore(elem, context.nextSibling);
	context.nextSibling.parentNode.insertBefore(
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
	oldParent,
	oldIndex,
	setup
});
