const compileAndCreate = require('../compileAndCreate');

const element = compileAndCreate(`<template a-if="condition">Hello</template>`);

it('render', () => {
	element.setState({
		condition: true
	});

	expect(element.innerHTML).toMatchSnapshot();
});

it('remove elements', () => {
	element.setState({
		condition: false
	});

	expect(element.innerHTML).toMatchSnapshot();
});
