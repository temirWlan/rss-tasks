import Cell from './cell';
import create from '../services/create';
import { addZero, setCorrectNum } from '../services/services';
import * as storage from '../services/storage';

export default class Puzzle {
	constructor(classes) {
		this.baseLocation = window.location.href;
		this.isActive = false;
		this.isGameOver = false;
		this.moves = 0;
		this.initialTime = 0;
		// this.time = '00:00:00';
		this.time = {
			hours: '00',
			minutes: '00',
			seconds: '00'
		};
		this.ticks = 0;
		this.size = storage.get('gameSettings') ? +storage.get('gameSettings')['size'] : 3;
		this.numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8];
		this.sortedNumbers = this.numbers.sort((a, b) => a - b);
		this.list = [
			{label: 'New Game', path: '#'},
			{label: 'Saved games', path: '#'},
			{label: 'Best scores', path: '#'},
			{label: 'Rules', path: '#'},
			{label: 'Settings', path: '#'},
		];
		this.triggers = [];
		this.gameModes = [
			{size: 3, label: '3x3'},
			{size: 4, label: '4x4'},
			{size: 5, label: '5x5'},
			{size: 6, label: '6x6'},
			{size: 7, label: '7x7'},
			{size: 8, label: '8x8'},
			{size: 9, label: '9x9'},
			{size: 10, label: '10x10'}
		];
		this.scoreOptions = ['Date', 'Time', 'Moves', 'Size'];
		this.savedGamesOptions = ['Time', 'Moves', 'Size'];
		this.bestScores = [
			{
				date: '17.11.2020',
				time: '00:02:33',
				moves: '33',
				size: '3x3'
			},
			...storage.get('results')
		];
		this.savedGames = [
			{
				time: this.time,
				size: this.size,
				moves: this.moves
			},
			// ...storage.get('savedGames')
		];
	}

	init() {
		this.numbers = this.generateRandomArray(this.size ** 2)
		this.sortedNumbers = [...this.numbers].sort((a, b) => a - b);
		this.render();
		this.updateTime();
		this.moveField.textContent = `${this.moves}`;

		this.modeDropdown.addEventListener('click', e => {
			for (let node of e.target.childNodes) {
				if (node.selected === true) {
					this.selectMode(+node.dataset.size);
				}
			}		
		});

		this.grid.addEventListener('click', e => { 
			this.removeItems('button');

			const targetIndex = this.numbers.findIndex(num => num === +e.target.textContent);
			const zeroIndex = this.numbers.findIndex(num => num === 0);

			const top = zeroIndex - this.size < 0 ? null : zeroIndex - this.size;
			const right = (zeroIndex + 1) % this.size === 0 ? null : zeroIndex + 1;
			const bottom = zeroIndex + this.size >= this.size ** 2 ? null : zeroIndex + this.size;
			const left = (zeroIndex + 1) % this.size === 1 ? null : zeroIndex - 1;
			const idx = [top, right, left, bottom];
			
			for (let i = 0; i < idx.length; i++) {
				if (targetIndex === idx[i]) {
					if (e.target.nodeName === 'BUTTON') {
						this.moves += 1;
						this.moveField.textContent = `${this.moves}`;
						this.playSound(this.sound);
					}

					this.numbers[zeroIndex] = this.numbers[targetIndex];
					this.numbers[targetIndex] = 0;
				}
			}

			this.generateItems(this.numbers);
			let numStr = [...this.numbers].join('');
			let sortedNumStr = [...this.sortedNumbers.slice(1), this.sortedNumbers[0]].join('');

			if (numStr === sortedNumStr) {
				this.isGameOver = true;

				this.openMenu(this.menuTrigger, this.menu)
				this.showGameOver(this.time, this.moves);
				this.menu.append(this.gameOverScreen);
				this.showScreen(this.gameOverScreen, this.menu, 'active');
	
				const results = storage.get('results');
				const { hours, minutes, seconds } = this.time;
				const { day, month, year } = this.getCurrentDate();

				const result = {
					date: `${day}.${month}.${year}`,
					time: `${hours}:${minutes}:${seconds}`,
					moves: `${this.moves}`,
					size: `${this.size}x${this.size}`
				};

				if (results && results.length) {
					storage.remove('results');
					storage.set('results', [...results, result])
				} else {
					storage.set('results', [result])
				}
			}
		});

		this.openMenu(this.menuTrigger, this.menu);
		this.menuTrigger.addEventListener('click', e => this.toggleMenu(e));
		this.listItems.forEach(item => item.addEventListener('click', (e) => this.routeMenu(e)));
		this.saveBtn.addEventListener('click', e => this.saveGame(e));
		this.goBackBtn.addEventListener('click', () => this.showScreen(this.menuNavigation, this.menu, 'active'));

		this.wrapper = create('div', { classes: ['wrapper'] }, null, [
			this.box,
			this.sound
		]); 
		document.body.append(this.wrapper);
	}

	render() {
		if (this.list.length) {
			this.listItems = this.list.map(({ label, path }) => {
				return create('li', { classes: ['box__menu-list-item'] }, null, [
					create('a', { attributes: [['href', path]] }, label)
				])
			});
		}

		this.saveBtn = create('a', { classes: ['save-btn'], attributes: [['href', '#']] }, 'save game');
		this.message = create('span', { classes: ['message'] }, 'Do you want to save the game?', [this.saveBtn]);
		// selected

		this.goBackBtn = create('button', { classes: ['nav-btn'] }, 'go back');
		this.menuTrigger = create('a', { classes: ['box__menu-trigger'], attributes: [['href', '#']] });

		// menu navigation
		this.menuNavigation = create('div', { classes: ['screen', 'box__menu-nav', 'active'] }, null, [
			this.message,
			create('ul', { classes: ['box__menu-list'] }, null, [
				...this.listItems
			])
		]);

		const { hours, minutes, seconds } = this.time;
		this.timeField = create('span', null, `Time: ${hours}:${minutes}:${seconds}`);

		// screens
		this.savedGamesScreen = create('div', { classes: ['screen'] }, null, [
			create('h3', { classes: ['box__menu-title'] }, 'Saved games'),
			create('table', { classes: ['screen__table', 'saved-games-table'] }, null, [
				create('tr', { classes: ['table__row'] }, null, [
					...this.savedGamesOptions.map(option =>  create('th', { classes: ['table__head'] }, `${option}`))
				]),
				...this.savedGames.map(({ size, time, moves }) => {
					return create('tr', { classes: ['table__row'] }, null, [
						create('td', null, `${size}`),
						create('td', null, `${time}`),
						create('td', null, `${moves}`),
						create('td', null, null, [
							create('button', { classes: ['load-btn'] }, 'Load game')
						])
					])
				})
			])
		]);

		this.scoreScreen = create('div', { classes: ['screen'] }, null, [
			create('h3', { classes: ['box__menu-title'] }, 'Best scores'),
			create('table', { classes: ['box__menu-table', 'table'] }, null, [
				create('tr', { classes: ['table__row'] }, null, [
					...this.scoreOptions.map(option =>  create('th', { classes: ['table__head'] }, `${option}`))
				]),
				...this.bestScores.map(({ date, time, moves, size }) => {
					return create('tr', { classes: ['table__row'] }, null, [
						create('td', null, `${date}`),
						create('td', null, `${time}`),
						create('td', null, `${moves}`),
						create('td', null, `${size}`)
					])
				})
			])
		]);

		this.rulesScreen = create('div', { classes: ['screen', 'rules-screen'] }, null, [
			create('h3', { classes: ['box__menu-title'] }, 'Rules of Gem Puzzle'),
			create('p', { classes: ['screen__description'] }, 'The object of the puzzle is to place the tiles in order by making sliding moves that use the empty space.'),
			create('p', { classes: ['screen__description'] }, 'You can save your game and load it later. Or you can just use pause button. Also you can choose game field size of color in Settings')
		]);

		this.modeDropdown = create('select', { classes: ['dropdown'] }, null, [
			...this.gameModes.map(({ size, label }) => {
				return create('option', { classes: ['dropdown__item'], attributes: [['data-size', `${size}`]] }, `${label}`);
			})
		]);

		this.settingsScreen = create('div', { classes: ['screen', 'settings-screen'] }, null, [
			create('h3', { classes: ['box__menu-title'] }, 'Settings'),
			this.modeDropdown
		]);

		this.menu = create('div', { classes: ['box__menu'] }, null, [
			this.menuNavigation,
			this.savedGamesScreen,
			this.scoreScreen,
			this.rulesScreen,
			this.settingsScreen,
			// this.gameOverScreen
		]);

		// panel
		this.moveField = create('span', { attributes: [['id', 'move']] })
		this.moveDesc = create('span', null, 'Moves:', [this.moveField]);

		this.panel = create('div', { classes: ['box__panel'] }, null, [
			this.menuTrigger,
			this.moveDesc,
			this.timeField
		]);
		// grid
		this.grid = create('div', { classes: ['box__grid'] });
		this.generateItems(this.numbers);

		this.grid.style.gridTemplateColumns =  `repeat(${this.size}, 1fr)`;
		this.grid.style.gridTemplateRows = `repeat(${this.size}, 1fr)`;

		// box
		this.box = create('div', { classes: ['box'] }, null, [
			this.panel,
			this.grid,
			this.menu
		]);

		this.sound = create('audio', { attributes: [['src', './assets/sounds/tink.wav']] });
	}

	getCurrentDate() {
		const date = new Date();
		const day = addZero(date.getDate()),
				month = addZero(date.getMonth() + 1),
				year = addZero(date.getFullYear());	

		return { date, day, month, year };
	}

	getCurrentTime() {
		const seconds = 0;
		setInterval(() => {
			this.updateTime(seconds + 1);
		}, 1000);
	}

	toggleMenu(e) {
		e.preventDefault();

		this.isActive = !this.isActive;

		!this.isActive ? this.openMenu(this.menuTrigger, this.menu) : this.closeMenu(this.menuTrigger, this.menu);
	}

	openMenu(item, menu) {
		item.textContent = 'Resume game';
		menu.style.display = 'flex';
	}

	closeMenu(item, menu) {
		item.textContent = 'Pause game';
		menu.style.display = 'none';
		this.showScreen(this.menuNavigation, this.menu, 'active');
	}

	routeMenu(e) {
		e.preventDefault();

		switch(e.target.textContent) {
			case 'New Game':
				this.resetGame();
				break;
			case 'Saved games':
				this.showScreen(this.savedGamesScreen, this.menu, 'active');
				break;
			case 'Best scores':
				this.showScreen(this.scoreScreen, this.menu, 'active');
				break;
			case 'Rules':
				this.showScreen(this.rulesScreen, this.menu, 'active');
				break;
			case 'Settings':
				this.showScreen(this.settingsScreen, this.menu, 'active');
				break;
		}
	}

	showScreen(el, parent, activeClass) {
		for (let node of parent.childNodes) {
			if (node.nodeName !== '#text') {
				node.classList.remove(activeClass);
				el.classList.add(activeClass);
			}
		}

		if (el !== this.menuNavigation) {
			el.append(this.goBackBtn);
		}
	}

	setLocation(path) {
		window.location.href = path;
	}

	generateRandomArray(length) {
		return Array.from(new Array(length).keys()).sort(() => Math.random() - 0.5);
	}

	resetGame() {
		this.isActive = !this.isActive;
		this.closeMenu(this.menuTrigger, this.menu);
		this.removeItems('button');
		this.numbers = this.generateRandomArray(this.size ** 2);
		this.sortedNumbers = [...this.numbers].sort((a, b) => a - b);
		this.grid.style.gridTemplateColumns =  `repeat(${this.size}, 1fr)`;
		this.grid.style.gridTemplateRows = `repeat(${this.size}, 1fr)`; 
		clearInterval(this.intervalId);
		this.initialTime = 0;
		this.updateTime();
		this.time = {
			hours: '00',
			minutes: '00',
			seconds: '00'
		};
		const { hours, minutes, seconds } = this.time;
		this.moves = 0;
		this.timeField.textContent = `${hours}:${minutes}:${seconds}`;
		this.moveField.textContent = `${this.moves}`;
		this.generateItems(this.numbers);
	}

	generateItems(arr) {
		if (arr && arr.length) {
			const cells = arr.map(number =>  create('button', { attributes: [['data-number', `${number}`]] }, `${number}`));
			cells.forEach(cell => this.grid.append(cell));
		}
	}

	updateTime() {
		this.intervalId = setInterval(() => {
			if (this.isActive) {
				this.initialTime += 1;

				const seconds = addZero(Math.floor(this.initialTime % 60)),
						minutes = addZero(Math.floor((this.initialTime / 60) % 60)),
						hours = addZero(Math.floor((this.initialTime / 60 / 60) % 60));

				this.time = { hours, minutes, seconds };
				this.timeField.textContent = `${hours}:${minutes}:${seconds}`;
			}
		}, 1000);
	}

	// need to fix and refactor
	removeItems(selector) {
		document.querySelectorAll(selector).forEach(item => item.remove());
	}

	saveGame(e) {
		e.preventDefault();
		this.message.textContent = 'Game saved!';

		setTimeout(() => {
			this.message.textContent = 'Do you want to save the game?';
			this.message.append(e.target);
		}, 5000);		

		const savedGames = storage.get('savedGames'); 
		const obj = {
			time: this.time,
			size: this.size,
			moves: this.moves
		};

		if (savedGames && savedGames.length) {
			storage.remove('savedGames');
			storage.set('savedGames', JSON.stringify([...savedGames, obj]));
		} else {
			storage.set('savedGames', JSON.stringify([obj]));
		}
	}
	
	playSound(audio) {
		if (!audio) {
			return;
		}

		audio.currentTime = 0;
		audio.play();
	}

	selectMode(size) {
		this.size = size;
		storage.set('gameSettings', {size: this.size});
	}

	showGameOver(time, moves) {
		const { hours, minutes, seconds } = time;

		this.gameOverScreen = create('div', { classes: ['screen'] }, null, [
			create('h3', { classes: ['box__menu-title'] }, 'Hooray!'),
			create('p', { classes: ['screen__description'] }, `You solved the puzzle in ${hours}:${minutes}:${seconds} time and ${moves} moves`)
		]);
	}
}