const t = require('@babel/types');
const { default: template } = require('@babel/template');

const { createContext, CHILD_NODES, DOCUMENT } = require('./context');
const { compileNode } = require('./compile-node');

module.exports = function createSetState(clazz, element, ownerDocument, id) {
	const newState = t.identifier('state');
	const assignDocument = template.ast`const ${DOCUMENT} = document;`;

	const context = createContext(
		{ ownerDocument, nextSibling: element.nextSibling, templateId: id },
		element
	);

	const ast = compileNode(element, context);

	context.hooks.forEach(hook => hook());

	const setState = t.classMethod(
		'method',
		t.identifier('setState'),
		[newState],
		t.blockStatement(
			template.ast`
				if (typeof ${newState} === "function")
					${newState} = ${newState}(this.$state);
				const ${CHILD_NODES} = "childNodes";
				${assignDocument}
				const ${context.identifier} = this.shadowRoot
				${ast}
				this.$state = state;
			`
		)
	);

	const [method] = clazz.get('body').pushContainer('body', setState);

	fixUnbindedIdentifier(method, assignDocument, newState);

	return method;
};

function fixUnbindedIdentifier(method, assignDocument, newState) {
	method.get('body').traverse({
		Identifier(path) {
			if (!path.scope.hasBinding(path.node.name)) {
				// If it's the property name of an object
				if (
					path.parent.type == 'MemberExpression' &&
					path.parent.property === path.node
				)
					return;
				// If it's the name of an object literal property
				if (path.parent.type === 'ObjectProperty') return;
				// If it's assignDocument
				if (path.parentPath.parent === assignDocument) return;

				const identifier = path.node;
				path.replaceWith(t.memberExpression(newState, identifier));

				/*const parent = path.findParent((path) => path.isBlockStatement())
				parent.replaceWith(
					template.ast`
						if (state.${identifier} !== this.$state.${identifier})
							${parent.node}
					`
				)*/
			}
		}
	});
}
