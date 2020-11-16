export default function create(tag, selectors, value, children) {
	const element = document.createElement(tag);

	if (selectors) {
		const { classes, attributes } = selectors;

		if (classes && classes.length) {
			classes.forEach(className => {
				element.classList.add(className);
			});
		}

		if (attributes && attributes.length) {
			attributes.forEach(attribute => {
				const [name, value] = attribute;

				element.setAttribute(name, value);
			});
		}
	} 

	if (value) {
		element.innerText = value;
	}

	if (children && children.length) {
		children.forEach(child => {
			element.append(child);
		});
	}

	return element;
}

/* params */
// tag - tag
// selectors - object: 
// - classes - array
// - attribute - array(name, value)
// value - string
// child - elements array