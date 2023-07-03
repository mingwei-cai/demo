let nDice = 5;
let nPoint = 6;
let nAward = 12;
let nState = 1 << nAward;
let nBonus = 63;
let nRoll = 3;
let nKeep = (1 << nDice) - 1;
let nIndex = 462;
let indexArray = [
	[0, 1, 7, 28, 84, 210],
	[0, 1, 6, 21, 56, 126],
	[0, 1, 5, 15, 35, 70],
	[0, 1, 4, 10, 20, 35],
	[0, 1, 3, 6, 10, 15],
	[0, 1, 2, 3, 4, 5],
];
/** @type {(countArray: number[]) => number} */
let getIndex = (countArray) => {
	let index = 0;
	let count = 0;
	for (let point = nPoint; point >= 1; point -= 1) {
		count += countArray[point];
		index += indexArray[point - 1][count];
	};
	return index;
};
/** @type {(index: number) => number[]} */
let getCounts = (index) => {
	/** @type {number[]} */
	let countArray = new Array(nPoint + 1);
	let count = nDice;
	for (let point = 1; point <= nPoint; point += 1) {
		countArray[point - 1] = 0;
		while (indexArray[point - 1][count] > index) {
			count -= 1;
			countArray[point - 1] += 1;
		};
		index -= indexArray[point - 1][count];
	};
	countArray[nPoint] = count;
	return countArray;
};
/** @type {((countArray: number[]) => number)[]} */
let checkAwardArray = [
	(countArray) => {
		return countArray[1] * 1;
	},
	(countArray) => {
		return countArray[2] * 2;
	},
	(countArray) => {
		return countArray[3] * 3;
	},
	(countArray) => {
		return countArray[4] * 4;
	},
	(countArray) => {
		return countArray[5] * 5;
	},
	(countArray) => {
		return countArray[6] * 6;
	},
	(countArray) => {
		let score = 0;
		for (let point = 1; point <= nPoint; point += 1) {
			score += countArray[point] * point;
		};
		return score;
	},
	(countArray) => {
		let score = 0;
		let ok = false;
		for (let point = 1; point <= nPoint; point += 1) {
			score += countArray[point] * point;
			if (countArray[point] >= 4) {
				ok = true;
			};
		};
		return ok ? score : 0;
	},
	(countArray) => {
		let score = 0;
		let ok2 = false;
		let ok3 = false;
		for (let point = 1; point <= nPoint; point += 1) {
			score += countArray[point] * point;
			if (countArray[point] == 2) {
				ok2 = true;
			};
			if (countArray[point] == 3) {
				ok3 = true;
			};
		};
		return ok2 && ok3 ? score : 0;
	},
	(countArray) => {
		for (let endPoint = 4; endPoint <= nPoint; endPoint += 1) {
			let ok = true;
			for (let point = endPoint - 3; point <= endPoint; point += 1) {
				if (countArray[point] == 0) {
					ok = false;
					break;
				};
			};
			if (ok) {
				return 15;
			};
		};
		return 0;
	},
	(countArray) => {
		for (let endPoint = 5; endPoint <= nPoint; endPoint += 1) {
			let ok = true;
			for (let point = endPoint - 4; point <= endPoint; point += 1) {
				if (countArray[point] == 0) {
					ok = false;
					break;
				};
			};
			if (ok) {
				return 30;
			};
		};
		return 0;
	},
	(countArray) => {
		for (let point = 1; point <= nPoint; point += 1) {
			if (countArray[point] == 5) {
				return 50;
			};
		};
		return 0;
	},
];
/** @type {Float64Array[]} */
let stateScoreArray = new Array(nState);
/** @type {(state: number, bonus: number) => number[][]} */
let getRollScores = (state, bonus) => {
	/** @type {number[][]} */
	let rollScoreArray = new Array(nRoll);
	for (let roll = 0; roll < nRoll; roll += 1) {
		rollScoreArray[roll] = new Array(nIndex);
		for (let index = nIndex - 1; index >= 0; index -= 1) {
			let countArray = getCounts(index);
			if (countArray[0] > 0) {
				let totalScore = 0;
				for (let point = 1; point <= nPoint; point += 1) {
					countArray[point] += 1;
					totalScore += rollScoreArray[roll][getIndex(countArray)];
					countArray[point] -= 1;
				};
				rollScoreArray[roll][index] = totalScore / nPoint;
				continue;
			};
			if (roll == 0) {
				let score = 0;
				for (let award = 0; award < nAward; award += 1) {
					if ((state >> award & 1) > 0) {
						let awardScore = checkAwardArray[award](countArray);
						score = Math.max(awardScore + stateScoreArray[state & ~(1 << award)][award < nPoint ? Math.min(bonus + awardScore, nBonus) : bonus], score);
					};
				};
				rollScoreArray[roll][index] = score;
				continue;
			};
			let pointArray = new Array(nDice);
			for (let point = 1, dice = 0; dice < nDice; dice += 1) {
				while (countArray[point] == 0) {
					point += 1;
				};
				countArray[point] -= 1;
				pointArray[dice] = point;
			};
			let score = rollScoreArray[0][index];
			for (let keep = 0; keep < nKeep; keep += 1) {
				for (let point = 0; point <= nPoint; point += 1) {
					countArray[point] = 0;
				};
				for (let dice = 0; dice < nDice; dice += 1) {
					countArray[(keep >> dice & 1) > 0 ? pointArray[dice] : 0] += 1;
				};
				score = Math.max(rollScoreArray[roll - 1][getIndex(countArray)], score);
			};
			rollScoreArray[roll][index] = score;
		};
	};
	return rollScoreArray;
};
let awardNameArray = [
	'一點',
	'二點',
	'三點',
	'四點',
	'五點',
	'六點',
	'全選',
	'四條',
	'葫蘆',
	'小順',
	'大順',
	'快艇',
];
let buildDiceAreaHtml = () => {
	/** @type {string[]} */
	let htmlArray = [];
	htmlArray.push('<div class="dice-area" data-enable="0">');
	for (let dice = 0; dice < nDice; dice += 1) {
		htmlArray.push('<div class="dice" data-dice="' + dice + '" data-point="0" data-keep="0"></div>');
	};
	htmlArray.push('</div>');
	return htmlArray.join('');
};
let buildScoreTableHtml = () => {
	/** @type {string[]} */
	let htmlArray = [];
	htmlArray.push('<table class="score-table" data-enable="0">');
	htmlArray.push('<thead><tr class="highlight"><th>項目</th><th>分數</th></tr></thead>');
	htmlArray.push('<tbody>');
	for (let award = 0; award < nPoint; award += 1) {
		htmlArray.push('<tr><th>' + awardNameArray[award] + '</th><td class="award-score" data-award="' + award + '" data-state="0"></td></tr>');
	};
	htmlArray.push('<tr class="highlight"><th>加分</th><td class="bonus-score"></td></tr>');
	for (let award = nPoint; award < nAward; award += 1) {
		htmlArray.push('<tr><th>' + awardNameArray[award] + '</th><td class="award-score" data-award="' + award + '" data-state="0"></td></tr>');
	};
	htmlArray.push('<tr class="highlight"><th>總分</th><td class="total-score"></td></tr>');
	htmlArray.push('</tbody>');
	htmlArray.push('</table>');
	return htmlArray.join('');
};
document.body.insertAdjacentHTML('beforeend', [
	'<div class="game">',
	'<div class="left">',
	'<div class="message"></div>',
	buildDiceAreaHtml(),
	'</div>',
	'<div class="right">',
	buildScoreTableHtml(),
	'<div class="button-area">',
	'<button class="human-play" disabled>開始遊戲</button>',
	'<button class="ai-play" disabled>電腦示範</button>',
	'<button class="roll-dice" disabled>擲骰</button>',
	'</div>',
	'</div>',
	'</div>',
].join(''));
/** @type {HTMLDivElement} */
let gameDiv = document.querySelector('.game');
/** @type {HTMLDivElement} */
let messageDiv = document.querySelector('.message');
/** @type {HTMLButtonElement} */
let humanPlayButton = document.querySelector('.human-play');
/** @type {HTMLButtonElement} */
let aiPlayButton = document.querySelector('.ai-play');
/** @type {HTMLButtonElement} */
let rollDiceButton = document.querySelector('.roll-dice');
let game = {
	state: 0,
	bonus: 0,
	roll: 0,
	keep: 0,
	/** @type {number[]} */
	pointArray: new Array(nDice),
	/** @type {number[]} */
	awardScoreArray: new Array(nAward),
	/** @type {number[]} */
	currentAwardScoreArray: new Array(nAward),
	isEnabled: false,
};
let updateDiceArea = () => {
	for (let dice = 0; dice < nDice; dice += 1) {
		/** @type {HTMLDivElement} */
		let diceDiv = document.querySelector('.dice[data-dice="' + dice + '"]');
		diceDiv.dataset['point'] = game.pointArray[dice];
		diceDiv.dataset['keep'] = game.keep >> dice & 1;
	};
};
let updateGameDiv = () => {
	updateDiceArea();
	let score = game.bonus < nBonus ? 0 : 35;
	/** @type {HTMLDivElement} */
	let bonusScoreDiv = document.querySelector('.bonus-score');
	if (score == 0 && (game.state & (1 << nPoint) - 1) > 0) {
		bonusScoreDiv.innerHTML = '';
	} else {
		bonusScoreDiv.textContent = score;
	};
	for (let award = 0; award < nAward; award += 1) {
		/** @type {HTMLDivElement} */
		let awardScoreDiv = document.querySelector('.award-score[data-award="' + award + '"]');
		awardScoreDiv.dataset['state'] = game.state >> award & 1;
		if ((game.state >> award & 1) == 0) {
			awardScoreDiv.textContent = game.awardScoreArray[award];
			score += game.awardScoreArray[award];
		} else if (game.isEnabled) {
			awardScoreDiv.textContent = game.currentAwardScoreArray[award];
		} else {
			awardScoreDiv.innerHTML = '';
		};
	};
	/** @type {HTMLDivElement} */
	let totalScoreDiv = document.querySelector('.total-score');
	totalScoreDiv.textContent = score;
	gameDiv.dataset['enabled'] = +game.isEnabled;
};
/** @type {(msg: string) => void} */
let showMessage = (msg) => {
	messageDiv.append(msg, document.createElement('br'));
	messageDiv.scrollTo(0, messageDiv.scrollHeight);
};
let clearMessage = () => {
	messageDiv.innerHTML = '';
};
let player = {
	isHuman: false,
	/** @type {() => void} */
	onRoundStart: null,
	/** @type {() => void} */
	onRollEnd: null,
};
let startGame = () => {
	clearMessage();
	game.state = nState - 1;
	game.bonus = 0;
	for (let dice = 0; dice < nDice; dice += 1) {
		game.pointArray[dice] = 0;
	};
	for (let award = 0; award < nAward; award += 1) {
		game.awardScoreArray[award] = 0;
	};
	game.keep = 0;
	game.isEnabled = false;
	updateGameDiv();
	setTimeout(startRound, 200);
};
let startRound = () => {
	game.roll = nRoll;
	showMessage('--- 回合開始 ---');
	player.onRoundStart();
};
let startRoll = () => {
	for (let dice = 0; dice < nDice; dice += 1) {
		if ((game.keep >> dice & 1) == 0) {
			game.pointArray[dice] = 0;
		};
	};
	if (game.roll < nRoll) {
		showMessage('保留 ' + game.pointArray.map(value => value == 0 ? '-' : value).join(' '));
	};
	game.roll -= 1;
	game.isEnabled = false;
	updateGameDiv();
	setTimeout(endRoll, 200);
};
let endRoll = () => {
	/** @type {number[]} */
	let countArray = new Array(nPoint + 1);
	for (let point = 0; point <= nPoint; point += 1) {
		countArray[point] = 0;
	};
	for (let dice = 0; dice < nDice; dice += 1) {
		if (game.pointArray[dice] == 0) {
			game.pointArray[dice] = Math.floor(Math.random() * 6) + 1;
		};
		countArray[game.pointArray[dice]] += 1;
	};
	for (let award = 0; award < nAward; award += 1) {
		game.currentAwardScoreArray[award] = checkAwardArray[award](countArray);
	};
	game.isEnabled = true;
	updateGameDiv();
	showMessage('擲骰 ' + game.pointArray.join(' ') + ' 剩' + game.roll + '次');
	player.onRollEnd();
};
/** @type {(award: number) => void} */
let endRound = (award) => {
	let awardScore = game.currentAwardScoreArray[award];
	showMessage('獲得' + awardNameArray[award] + '分數 ' + awardScore);
	game.awardScoreArray[award] = awardScore;
	game.state = game.state & ~(1 << award);
	if (award < nPoint) {
		game.bonus = Math.min(game.bonus + awardScore, nBonus)
	};
	game.keep = 0;
	game.isEnabled = false;
	updateGameDiv();
	setTimeout(game.state > 0 ? startRound : endGame, 200);
};
let endGame = () => {
	let score = game.bonus < nBonus ? 0 : 35;
	for (let award = 0; award < nAward; award += 1) {
		score += game.awardScoreArray[award];
	};
	showMessage('--- 總分 ' + score + ' ---');
	humanPlayButton.disabled = false;
	aiPlayButton.disabled = false;
};
let humanStartRound = () => {
	rollDiceButton.disabled = false;
};
let humanEndRoll = () => {
	if (game.roll > 0) {
		rollDiceButton.disabled = false;
	};
};
/** @type {number[][]} */
let rollScoreArray = null;
let aiStartRound = () => {
	rollScoreArray = getRollScores(game.state, game.bonus);
	setTimeout(startRoll, 500);
};
let aiEndRoll = () => {
	if (game.roll > 0) {
		/** @type {number[]} */
		let countArray = new Array(nPoint + 1);
		for (let point = 0; point <= nPoint; point += 1) {
			countArray[point] = 0;
		};
		for (let dice = 0; dice < nDice; dice += 1) {
			countArray[game.pointArray[dice]] += 1;
		};
		let bestScore = rollScoreArray[0][getIndex(countArray)];
		let bestKeep = nKeep;
		for (let keep = 0; keep < nKeep; keep += 1) {
			/** @type {number[]} */
			let newCountArray = new Array(nPoint + 1);
			for (let point = 0; point <= nPoint; point += 1) {
				newCountArray[point] = 0;
			};
			for (let dice = 0; dice < nDice; dice += 1) {
				newCountArray[(keep >> dice & 1) > 0 ? game.pointArray[dice] : 0] += 1;
			};
			let score = rollScoreArray[game.roll - 1][getIndex(newCountArray)];
			if (score > bestScore) {
				bestScore = score;
				bestKeep = keep;
			};
		};
		if (bestKeep < nKeep) {
			game.keep = bestKeep;
			setTimeout(() => {
				updateDiceArea();
				setTimeout(startRoll, 200);
			}, 1000);
			return;
		};
	};
	let bestScore = -1;
	let bestAward = 0;
	for (let award = 0; award < nAward; award += 1) {
		if ((game.state >> award & 1) > 0) {
			let awardScore = game.currentAwardScoreArray[award];
			let state = game.state & ~(1 << award);
			let bonus = award < nPoint ? Math.min(game.bonus + awardScore, nBonus) : game.bonus;
			let score = awardScore + stateScoreArray[state][bonus];
			if (score > bestScore) {
				bestScore = score;
				bestAward = award;
			};
		};
	};
	setTimeout(() => {
		endRound(bestAward);
	}, 1000);
	return;
};
gameDiv.addEventListener('click', (ev) => {
	if (!(game.isEnabled && player.isHuman)) {
		return true;
	};
	/** @type {HTMLElement} */
	let element = ev.target;
	if (element.className == 'dice') {
		let dice = +element.dataset['dice'];
		game.keep ^= 1 << dice;
		updateDiceArea();
		return true;
	};
	if (element.className == 'award-score') {
		let award = +element.dataset['award'];
		if ((game.state >> award & 1) > 0) {
			rollDiceButton.disabled = true;
			endRound(award);
		};
	};
	return true;
});
humanPlayButton.addEventListener('click', (ev) => {
	humanPlayButton.disabled = true;
	aiPlayButton.disabled = true;
	rollDiceButton.disabled = true;
	player.isHuman = true;
	player.onRoundStart = humanStartRound;
	player.onRollEnd = humanEndRoll;
	startGame();
});
aiPlayButton.addEventListener('click', (ev) => {
	humanPlayButton.disabled = true;
	aiPlayButton.disabled = true;
	rollDiceButton.disabled = true;
	player.isHuman = false;
	player.onRoundStart = aiStartRound;
	player.onRollEnd = aiEndRoll;
	startGame();
});
rollDiceButton.addEventListener('click', (ev) => {
	humanPlayButton.disabled = true;
	aiPlayButton.disabled = true;
	rollDiceButton.disabled = true;
	startRoll();
});
{
	let xhr = new XMLHttpRequest();
	xhr.open('GET', 'yahtzee.blob');
	xhr.responseType = 'arraybuffer';
	xhr.onload = () => {
		/** @type {ArrayBuffer} */
		let stateScoreArrayBuffer = xhr.response;
		for (let state = 0; state < nState; state += 1) {
			stateScoreArray[state] = new Float64Array(stateScoreArrayBuffer, state * (nBonus + 1) * 8, nBonus + 1);
		};
		humanPlayButton.disabled = false;
		aiPlayButton.disabled = false;
	};
	xhr.send();
};
