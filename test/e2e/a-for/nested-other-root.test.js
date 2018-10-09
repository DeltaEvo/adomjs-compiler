const compileAndCreate = require('../compileAndCreate');

const element = compileAndCreate(`
<template a-for="elem1 of list1">
	<span>{{ elem1 }}</span>
	<span>{{ elem1 }}</span>
	<div>
		<template a-for="elem2 of list2">
			<span>{{ elem2 }}</span>
			<span>{{ elem2 }}</span>
		</template>
	</div>
</template>
`);

it('render', () => {
	element.setState({
		list1: ['Hello', 'World'],
		list2: ['Bonjour', 'Monde']
	});


	expect(element.innerHTML).toMatchSnapshot();
});

it('remove elements', () => {
	element.setState({
		list1: ['Hello'],
		list2: ['Bonjour']
	});

	expect(element.innerHTML).toMatchSnapshot();
});
