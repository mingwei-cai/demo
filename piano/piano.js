
/** @type {(x: any) => string} */
function getType(x) {
	return Object.prototype.toString.call(x).slice(8, -1);
};

/** @type {(root: any, ...contentArray: any[]) => Node} */
function makeNode(root, ...contentArray) {
	/** @type {ParentNode} */
	let e = null;
	if (getType(root) == 'String') {
		let t = document.createElement('template');
		t.insertAdjacentHTML('beforeend', root);
		e = t.firstChild;
	} else {
		e = root;
	};
	if (contentArray.length > 0) {
		let f = document.createDocumentFragment();
		for (let content of contentArray) {
			if (content instanceof Node) {
				f.appendChild(content);
			} else if (getType(content) == 'Array') {
				f.appendChild(makeNode(...content));
			} else {
				f.appendChild(document.createTextNode(content));
			};
		};
		e.appendChild(f);
	};
	return e;
};

let keyboardLayout = [
	['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
	['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'],
	['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'],
	['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'],
];

makeNode(document.body,
	['<div>',
		'Tonality: ',
		['<input type="number" class="tonality-input" min="-84" max="84">'],
	],
	['<div>',
		'Press "shift" to ',
		['<select class="accidental-select">',
			['<option value="+7">', 'Sharp'],
			['<option value="-7">', 'Flat'],
		],
	],
	['<div class="keyboard-div">', ...keyboardLayout.map((codeArray, row) =>
		['<div style="padding-left: ' + row + 'em; ">', ...codeArray.map((code) =>
			['<div class="key-div" data-code="' + code + '" data-press="false">'],
		)],
	)],
);

/** @type {HTMLInputElement} */
let tonalityInput = document.querySelector('.tonality-input');
tonalityInput.value = 0;

/** @type {HTMLSelectElement} */
let accidentalSelect = document.querySelector('.accidental-select');

/** @type {HTMLDivElement} */
let keyboardDiv = document.querySelector('.keyboard-div');

/** @type {Object<string, number>} */
let toneByCode = {};

/** @type {Object<string, OscillatorNode>} */
let oscillatorNodeByCode = {};

for (let i = 0; i < keyboardLayout.length; i += 1) {
	let codeArray = keyboardLayout[i];
	for (let j = 0; j < codeArray.length; j += 1) {
		let code = codeArray[j];
		toneByCode[code] = (j - i * 7) * 12 + 23;
		oscillatorNodeByCode[code] = null;
	};
};

let audioContext = new AudioContext();
let gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);
gainNode.gain.value = 0.25;

document.addEventListener('keydown', function (ev) {
	let code = ev.code;
	if (code in toneByCode && oscillatorNodeByCode[code] == null) {
		let tone = toneByCode[code] + +tonalityInput.value;
		if (ev.shiftKey) {
			ev.preventDefault();
			tone += +accidentalSelect.value;
		};
		let pitch = Math.round(tone / 7);
		let oscillatorNode = audioContext.createOscillator();
		oscillatorNodeByCode[code] = oscillatorNode;
		oscillatorNode.type = 'sawtooth';
		oscillatorNode.frequency.value = 440;
		oscillatorNode.detune.value = pitch * 100;
		oscillatorNode.connect(gainNode);
		oscillatorNode.start();
		/** @type {HTMLDivElement} */
		let keyDiv = keyboardDiv.querySelector('.key-div[data-code="' + code + '"]');
		keyDiv.dataset.press = true;
	};
});

document.addEventListener('keyup', function (ev) {
	let code = ev.code;
	let oscillatorNode = oscillatorNodeByCode[code];
	if (oscillatorNode != null) {
		oscillatorNodeByCode[code] = null;
		oscillatorNode.stop();
		/** @type {HTMLDivElement} */
		let keyDiv = keyboardDiv.querySelector('.key-div[data-code="' + code + '"]');
		keyDiv.dataset.press = false;
	};
});
