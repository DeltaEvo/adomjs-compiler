const compileAndCreate = require('./compileAndCreate');

it('render', () => {
	const element = compileAndCreate(``);
	expect(element.innerHTML).toMatchSnapshot();
});
