/** @type {(shape: bigint) => bigint} */
let getPosition = (shape) => {
	let position = -1n;
	for (shape &= -shape; shape > 0n; shape >>= 1n) {
		position += 1n;
	};
	return position;
};

/** @type {(shape: bigint) => bigint} */
let rotate = (shape) => {
	shape = shape >> 4n & 0x0F0F0F0F00000000n | shape >> 32n & 0x000000000F0F0F0Fn | shape << 4n & 0x00000000F0F0F0F0n | shape << 32n & 0xF0F0F0F000000000n;
	shape = shape >> 2n & 0x3333000033330000n | shape >> 16n & 0x0000333300003333n | shape << 2n & 0x0000CCCC0000CCCCn | shape << 16n & 0xCCCC0000CCCC0000n;
	shape = shape >> 1n & 0x5500550055005500n | shape >> 8n & 0x0055005500550055n | shape << 1n & 0x00AA00AA00AA00AAn | shape << 8n & 0xAA00AA00AA00AA00n;
	return shape;
};

/** @type {(shape: bigint) => bigint} */
let countBit = (shape) => {
	shape = (shape & 0x5555555555555555n) + (shape >> 1n & 0x5555555555555555n);
	shape = (shape & 0x3333333333333333n) + (shape >> 2n & 0x3333333333333333n);
	shape = (shape & 0x0F0F0F0F0F0F0F0Fn) + (shape >> 4n & 0x0F0F0F0F0F0F0F0Fn);
	shape = (shape & 0x00FF00FF00FF00FFn) + (shape >> 8n & 0x00FF00FF00FF00FFn);
	shape = (shape & 0x0000FFFF0000FFFFn) + (shape >> 16n & 0x0000FFFF0000FFFFn);
	shape = (shape & 0x00000000FFFFFFFFn) + (shape >> 32n & 0x00000000FFFFFFFFn);
	return shape;
};

class Piece {
	name = '';
	answer = 0n;
	/** @type {bigint[]} */
	shapeArray = null;
	/** @type {bigint[]} */
	minShiftArray = null;
	/** @type {bigint[]} */
	maxShiftArray = null;
	/**
	 * @param {string} name
	 * @param {bigint} shape
	*/
	constructor(name, shape) {
		let shapeArray = [0n, 0n, 0n, 0n];
		let shiftArray = [0n, 0n, 0n, 0n];
		let padArray = [0n, 0n, 0n, 0n];
		for (let i = 0; i < 4; i += 1) {
			let position = getPosition(shape);
			shapeArray[i] = shape >> position;
			shiftArray[i] = position & 7n;
			padArray[i] = position >> 3n;
			shape = rotate(shape);
		};
		this.name = name;
		this.answer = 0n;
		this.shapeArray = [0n, 0n, 0n, 0n];
		this.minShiftArray = [0n, 0n, 0n, 0n];
		this.maxShiftArray = [0n, 0n, 0n, 0n];
		for (let i = 0; i < 4; i += 1) {
			this.shapeArray[i] = shapeArray[i];
			this.minShiftArray[i] = shiftArray[i] - padArray[(i + 1) & 3];
			this.maxShiftArray[i] = shiftArray[i] + padArray[(i + 3) & 3];
		};
	};
};

/** @type {(board: bigint, pieceArray: Piece[], m: number, endTime: number) => boolean} */
let solvePuzzle = (board, pieceArray, m, endTime) => {
	if (board == 0n) {
		pieceArray.length = m;
		return true;
	};
	if (Date.now() >= endTime) {
		return false;
	};
	let position = getPosition(board);
	let shift = position & 7n;
	board >>= position;
	for (let n = m; n < pieceArray.length && Date.now() < endTime; n += 1) {
		let piece = pieceArray[n];
		pieceArray[n] = pieceArray[m];
		for (let i = 0; i < 4; i += 1) {
			if (shift >= piece.minShiftArray[i] && shift <= piece.maxShiftArray[i] && (board & piece.shapeArray[i]) == piece.shapeArray[i] && solvePuzzle((board & ~piece.shapeArray[i]) << position, pieceArray, m + 1, endTime)) {
				piece.answer = piece.shapeArray[i] << position;
				pieceArray[m] = piece;
				return true;
			};
		};
		pieceArray[n] = piece;
	};
	return false;
};

let ui = {
	padSize: 4,
	cellSize: 9,
	scale: 5,
	isMouseEnter: false,
	shapeColor: '',
	shapeValue: 0n,
	/** @type {HTMLCanvasElement} */
	mainCanvas: null,
	/** @type {HTMLDivElement} */
	shapeAreaDiv: null,
	/** @type {HTMLDivElement} */
	shapeDiv: null,
	/** @type {HTMLCanvasElement} */
	shapeCanvas: null,
	/** @type {HTMLButtonElement} */
	solvePuzzleButton: null,
	/** @type {HTMLButtonElement} */
	addShapeButton: null,
	/** @type {HTMLButtonElement} */
	deleteShapeButton: null,
};

{
	let shapeSize = ui.padSize * 2 + 1 + ui.cellSize * 8;
	let mainSize = shapeSize * ui.scale;
	document.body.insertAdjacentHTML('beforeend', [
		'<div class="game">',
		'<div class="column">',
		'<div class="text">滑鼠按住左鍵繪製，按住右鍵擦除</div>',
		'<canvas width="' + mainSize + '" height="' + mainSize + '"></canvas>',
		'</div>',
		'<div class="column">',
		'<div class="text">圖案列表</div>',
		'<div class="shape-area">',
		'<div class="shape" data-value="0000000000000000">',
		'<canvas width="' + shapeSize + '" height="' + shapeSize + '"></canvas>',
		'<div class="info">',
		'名稱： <input class="name" type="text" value="題目" disabled><br>',
		'數量： <input class="count" type="number" min="0" max="99" value="1" disabled><br>',
		'</div>',
		'</div>',
		'</div>',
		'<div class="button-area">',
		'<button class="solve-puzzle" disabled>解答</button>',
		'<button class="add-shape" disabled>新增</button>',
		'<button class="delete-shape" disabled>刪除</button>',
		'</div>',
		'</div>',
		'</div>',
	].join(''));
};

ui.mainCanvas = document.querySelector('canvas');
ui.shapeAreaDiv = document.querySelector('.shape-area');
ui.solvePuzzleButton = document.querySelector('.solve-puzzle');
ui.addShapeButton = document.querySelector('.add-shape');
ui.deleteShapeButton = document.querySelector('.delete-shape');

let showShape = () => {
	if (ui.shapeCanvas != null) {
		let ctx = ui.mainCanvas.getContext('2d');
		ctx.clearRect(0, 0, ui.mainCanvas.width, ui.mainCanvas.height);
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(ui.shapeCanvas, 0, 0, ui.mainCanvas.width, ui.mainCanvas.height);
	};
};

/** @type {(shapeDiv: HTMLDivElement) => void} */
let selectShape = (shapeDiv) => {
	if (shapeDiv == ui.shapeDiv) {
		return;
	};
	if (ui.shapeDiv != null) {
		ui.shapeDiv.classList.remove('selected');
	};
	shapeDiv.classList.add('selected');
	ui.shapeDiv = shapeDiv;
	ui.shapeCanvas = shapeDiv.querySelector('canvas');
	ui.shapeValue = BigInt('0x' + shapeDiv.dataset['value']);
	if (shapeDiv.previousElementSibling == null) {
		ui.shapeColor = '#CBA';
		ui.deleteShapeButton.disabled = true;
	} else {
		ui.shapeColor = '#FED';
		ui.deleteShapeButton.disabled = false;
	};
	ui.solvePuzzleButton.disabled = false;
	showShape();
};

/** @type {(ev: MouseEvent) => void} */
let drawShape = (ev) => {
	let mouseX = Math.floor((ev.offsetX - (ui.padSize + 0.5) * ui.scale) / (ui.cellSize * ui.scale));
	let mouseY = Math.floor((ev.offsetY - (ui.padSize + 0.5) * ui.scale) / (ui.cellSize * ui.scale));
	if (mouseX < 0 || mouseX >= 8 || mouseY < 0 || mouseY >= 8) {
		if (ui.isMouseEnter) {
			ui.isMouseEnter = false;
			showShape();
		};
		return;
	};
	if (ui.shapeDiv == null) {
		return;
	};
	ui.isMouseEnter = true;
	let mouseButton = ev.buttons & 3;
	if (mouseButton == 1) {
		ui.shapeValue |= 1n << BigInt(mouseY * 8 + mouseX);
	} else if (mouseButton == 2) {
		ui.shapeValue &= ~(1n << BigInt(mouseY * 8 + mouseX));
	};
	ui.shapeDiv.dataset['value'] = ('0000000000000000' + ui.shapeValue.toString(16)).slice(-16);
	let ctx = ui.shapeCanvas.getContext('2d');
	ctx.clearRect(0, 0, ui.shapeCanvas.width, ui.shapeCanvas.height);
	ctx.fillStyle = ui.shapeColor;
	for (let i = 0n; i < 64n; i += 1n) {
		if ((ui.shapeValue >> i & 1n) > 0n) {
			let x = Number(i & 7n);
			let y = Number(i >> 3n);
			ctx.fillRect(
				ui.padSize + x * ui.cellSize,
				ui.padSize + y * ui.cellSize,
				ui.cellSize,
				ui.cellSize,
			);
		};
	};
	ctx.fillStyle = '#987';
	for (let i = 0n; i < 64n; i += 1n) {
		let x = Number(i & 7n);
		let y = Number(i >> 3n);
		if (x == 0 && (ui.shapeValue >> i & 1n) > 0n) {
			ctx.fillRect(
				ui.padSize + x * ui.cellSize,
				ui.padSize + y * ui.cellSize,
				1,
				ui.cellSize + 1,
			);
		};
		if (x == 7 && (ui.shapeValue >> i & 1n) > 0n) {
			ctx.fillRect(
				ui.padSize + (x + 1) * ui.cellSize,
				ui.padSize + y * ui.cellSize,
				1,
				ui.cellSize + 1,
			);
		};
		if (x > 0 && (ui.shapeValue >> i & 1n) != (ui.shapeValue >> (i - 1n) & 1n)) {
			ctx.fillRect(
				ui.padSize + x * ui.cellSize,
				ui.padSize + y * ui.cellSize,
				1,
				ui.cellSize + 1,
			);
		};
		if ((ui.shapeValue >> i & 1n) != (ui.shapeValue >> (i + 8n) & 1n)) {
			ctx.fillRect(
				ui.padSize + x * ui.cellSize,
				ui.padSize + (y + 1) * ui.cellSize,
				ui.cellSize + 1,
				1,
			);
		};
		if (y == 0 && (ui.shapeValue >> i & 1n) > 0n) {
			ctx.fillRect(
				ui.padSize + x * ui.cellSize,
				ui.padSize + y * ui.cellSize,
				ui.cellSize + 1,
				1,
			);
		};
	};
	showShape();
	let mainCtx = ui.mainCanvas.getContext('2d');
	mainCtx.fillStyle = '#0F09';
	mainCtx.fillRect(
		(ui.padSize + mouseX * ui.cellSize) * ui.scale,
		(ui.padSize + mouseY * ui.cellSize) * ui.scale,
		(ui.cellSize + 1) * ui.scale,
		(ui.cellSize + 1) * ui.scale,
	);
};
ui.mainCanvas.addEventListener('mousemove', drawShape);
ui.mainCanvas.addEventListener('mousedown', drawShape);
ui.mainCanvas.addEventListener('mouseup', drawShape);

ui.mainCanvas.addEventListener('mouseleave', (ev) => {
	if (ui.isMouseEnter) {
		ui.isMouseEnter = false;
		showShape();
	};
});

ui.mainCanvas.addEventListener('contextmenu', (ev) => {
	ev.preventDefault();
});

ui.shapeAreaDiv.addEventListener('mousedown', (ev) => {
	/** @type {Element} */
	let target = ev.target;
	if (target != ui.shapeAreaDiv) {
		selectShape(target.closest('.shape'));
	};
});

ui.solvePuzzleButton.addEventListener('click', (ev) => {
	ui.solvePuzzleButton.disabled = true;
	ui.deleteShapeButton.disabled = true;
	if (ui.shapeDiv != null) {
		ui.shapeDiv.classList.remove('selected');
		ui.shapeDiv = null;
		ui.shapeCanvas = null;
	};
	/** @type {HTMLDivElement[]} */
	let shapeDivArray = [...ui.shapeAreaDiv.children];
	let board = BigInt('0x' + shapeDivArray.shift().dataset['value']);
	let bitCount = -countBit(board);
	/** @type {Piece[]} */
	let pieceArray = [];
	for (let shapeDiv of shapeDivArray) {
		/** @type {string} */
		let name = shapeDiv.querySelector('.name').value;
		let count = shapeDiv.querySelector('.count').value | 0;
		let shape = BigInt('0x' + shapeDiv.dataset['value']);
		if (shape == 0n) {
			continue;
		};
		bitCount += countBit(shape) * BigInt(count);
		for (let i = 0; i < count; i++) {
			pieceArray.push(new Piece(name, shape));
		};
	};
	let ctx = ui.mainCanvas.getContext('2d');
	ctx.clearRect(0, 0, ui.mainCanvas.width, ui.mainCanvas.height);
	ctx.font = '12px monospace';
	let endTime = Date.now() + 2000;
	if (bitCount != 0n || !solvePuzzle(board, pieceArray, 0, endTime)) {
		ctx.fillStyle = '#000';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(
			bitCount < 0n ? 'too less pieces' : bitCount > 0n ? 'too more pieces' : Date.now() >= endTime ? 'time out' : 'no answer',
			ui.mainCanvas.width / 2,
			ui.mainCanvas.height / 2,
		);
		return;
	};
	for (let piece of pieceArray) {
		if (piece.answer == 0n) {
			break;
		};
		ctx.fillStyle = '#FED';
		for (let i = 0n; i < 64n; i += 1n) {
			if ((piece.answer >> i & 1n) > 0n) {
				let x = Number(i & 7n);
				let y = Number(i >> 3n);
				ctx.fillRect(
					(ui.padSize + x * ui.cellSize) * ui.scale,
					(ui.padSize + y * ui.cellSize) * ui.scale,
					(ui.cellSize) * ui.scale,
					(ui.cellSize) * ui.scale,
				);
			};
		};
		ctx.fillStyle = '#987';
		for (let i = 0n; i < 64n; i += 1n) {
			let x = Number(i & 7n);
			let y = Number(i >> 3n);
			if (x == 0 && (piece.answer >> i & 1n) > 0n) {
				ctx.fillRect(
					(ui.padSize + x * ui.cellSize) * ui.scale,
					(ui.padSize + y * ui.cellSize) * ui.scale,
					ui.scale,
					(ui.cellSize + 1) * ui.scale,
				);
			};
			if (x == 7 && (piece.answer >> i & 1n) > 0n) {
				ctx.fillRect(
					(ui.padSize + (x + 1) * ui.cellSize) * ui.scale,
					(ui.padSize + y * ui.cellSize) * ui.scale,
					ui.scale,
					(ui.cellSize + 1) * ui.scale,
				);
			};
			if (x > 0 && (piece.answer >> i & 1n) != (piece.answer >> (i - 1n) & 1n)) {
				ctx.fillRect(
					(ui.padSize + x * ui.cellSize) * ui.scale,
					(ui.padSize + y * ui.cellSize) * ui.scale,
					ui.scale,
					(ui.cellSize + 1) * ui.scale,
				);
			};
			if ((piece.answer >> i & 1n) != (piece.answer >> (i + 8n) & 1n)) {
				ctx.fillRect(
					(ui.padSize + x * ui.cellSize) * ui.scale,
					(ui.padSize + (y + 1) * ui.cellSize) * ui.scale,
					(ui.cellSize + 1) * ui.scale,
					ui.scale,
				);
			};
			if (y == 0 && (piece.answer >> i & 1n) > 0n) {
				ctx.fillRect(
					(ui.padSize + x * ui.cellSize) * ui.scale,
					(ui.padSize + y * ui.cellSize) * ui.scale,
					(ui.cellSize + 1) * ui.scale,
					ui.scale,
				);
			};
		};
		let position = getPosition(piece.answer);
		let answerX = Number(position & 7n);
		let answerY = Number(position >> 3n);
		let gradient = ctx.createLinearGradient(
			(ui.padSize + answerX * ui.cellSize + 1) * ui.scale, 0,
			(ui.padSize + (answerX + 1) * ui.cellSize) * ui.scale, 0,
		);
		gradient.addColorStop(0.5, '#000');
		gradient.addColorStop(1, '#0000');
		ctx.fillStyle = gradient;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.fillText(
			piece.name,
			(ui.padSize + answerX * ui.cellSize + 1) * ui.scale,
			(ui.padSize + answerY * ui.cellSize + 1) * ui.scale,
		);
	};
});

ui.addShapeButton.addEventListener('click', (ev) => {
	let shapeSize = ui.padSize * 2 + 1 + ui.cellSize * 8;
	ui.shapeAreaDiv.insertAdjacentHTML('beforeend', [
		'<div class="shape" data-value="0000000000000000">',
		'<canvas width="' + shapeSize + '" height="' + shapeSize + '"></canvas>',
		'<div class="info">',
		'名稱： <input class="name" type="text" value=""><br>',
		'數量： <input class="count" type="number" min="0" max="99" value="1"><br>',
		'</div>',
		'</div>',
	].join(''));
	selectShape(ui.shapeAreaDiv.lastElementChild);
	ui.shapeAreaDiv.scrollTo(0, ui.shapeAreaDiv.scrollHeight);
});

ui.deleteShapeButton.addEventListener('click', (ev) => {
	let nextShape = ui.shapeDiv.nextElementSibling || ui.shapeDiv.previousElementSibling;
	ui.shapeDiv.remove();
	ui.shapeDiv = null;
	ui.shapeCanvas = null;
	selectShape(nextShape);
});

selectShape(ui.shapeAreaDiv.firstElementChild);
ui.addShapeButton.disabled = false;
