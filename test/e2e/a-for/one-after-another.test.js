const compileAndCreate = require('../compileAndCreate');

const element = compileAndCreate(`
<span>Before</span>
<template a-for="elem of list">
	<span>{{ elem }}</span>
</template>
<span>Middle</span>
<template a-for="elem of list">
	<span>{{ elem }}</span>
</template>
<span>After</span>
`);

it('render', () => {
	element.setState({
		list: ['Hello', 'World']
	});

	expect(element.innerHTML).toMatchSnapshot();
});

it('remove elements', () => {
	element.setState({
		list: ['Hello']
	});

	expect(element.innerHTML).toMatchSnapshot();
});
