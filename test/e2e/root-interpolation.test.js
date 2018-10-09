const compileAndCreate = require('./compileAndCreate');

const element = compileAndCreate(`{{a}}`);

it('render with a value', () => {
	element.setState({
		a: 'Hello World'
	});
	expect(element.innerHTML).toMatchSnapshot();
});

it('render without value', () => {
	element.setState({
		a: undefined
	});
	expect(element.innerHTML).toMatchSnapshot();
});
