const JSDomEnvironment = require('jest-environment-jsdom');
const installCE = require('document-register-element/pony');

module.exports = class CustomElementEnvironment extends JSDomEnvironment {
	constructor(config) {
		super(config);
		installCE(this.dom.window);
	}

	setup() {
		return super.setup();
	}

	teardown() {
		return super.teardown();
	}

	runScript(script) {
		return super.runScript(script);
	}
};
