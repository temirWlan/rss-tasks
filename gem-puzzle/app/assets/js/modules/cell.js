import create from '../services/create';

export default class Cell {
	constructor({ parent, value, ticks, field }) {
		this.parent = parent;
		this.item = create('button', { attributes: [['data-number', `${value}`]] }, value);
		this.ticks = ticks;
		this.field = field;
	}

	init() {
		if (this.item) {
			this.parent.append(this.item);
		}
	}
}