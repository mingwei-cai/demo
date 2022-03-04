
/** @type {(m: number, n: number) => number} */
let gcd = (p, q) => {
	while (q > 0) {
		[p, q] = [q, p % q];
	};
	return p;
};

class QNum {
	x = 0;
	y = 0;
	constructor(y = 0, x = 1) {
		let z = gcd(Math.abs(x), Math.abs(y));
		this.x = x / z;
		this.y = y / z;
	};
	/** @type {(that: QNum) => QNum} */
	add(that) {
		return new QNum(this.y * that.x + this.x * that.y, this.x * that.x);
	};
	/** @type {(that: QNum) => QNum} */
	sub(that) {
		return new QNum(this.y * that.x - this.x * that.y, this.x * that.x);
	};
	/** @type {(that: QNum) => QNum} */
	mul(that) {
		return new QNum(this.y * that.y, this.x * that.x);
	};
	/** @type {(that: QNum) => QNum} */
	div(that) {
		return new QNum(this.y * that.x, this.x * that.y);
	};
	val() {
		return this.y / this.x;
	};
};

let n = 0;
/** @type {QNum[][]} */
let m = null;

let initMatrix = () => {
	let p = 3 + n;
	let q = p + n * 4;
	let t0 = new QNum();
	let t1 = new QNum(1);
	m = new Array(p);
	for (let i = 0; i < p; i += 1) {
		m[i] = new Array(q);
		for (let k = 0; k < q; k += 1) {
			m[i][k] = t0;
		};
	};
	m[0][p + 0] = t1;
	m[1][p + 1] = t1;
	m[2][p + 2] = t1;
	m[3][p + 3] = t1;
	for (let i = 1; i < n; i += 1) {
		m[0][p + i * 4 + 0] = t1;
		m[1][p + i * 4 + 1] = t1;
		m[2][p + i * 4 + 2] = t1;
		m[3][p + i * 4 + 3] = t1;
		m[3 + i][p + i * 4 + 0] = t1;
		m[3 + i][p + i * 4 + 1] = t1;
		m[3 + i][p + i * 4 + 2] = t1;
	};
	for (let i = 0; i < p; i += 1) {
		for (let j = 0; j <= i; j += 1) {
			let t = t0;
			for (let k = p; k < q; k += 1) {
				t = t.add(m[i][k].mul(m[j][k]));
			};
			m[i][j] = t;
			m[j][i] = t;
		};
	};
	for (let i = 0; i < p; i += 1) {
		let ii = -1;
		let zz = -1;
		for (let j = i; j < p; j += 1) {
			let z = Math.abs(m[j][i].val());
			if (z > zz) {
				ii = j;
				zz = z;
			};
		};
		[m[i], m[ii]] = [m[ii], m[i]];
		let t = m[i][i];
		for (let k = i; k < q; k += 1) {
			m[i][k] = m[i][k].div(t);
		};
		for (let j = 0; j < p; j += 1) {
			if (j == i) {
				continue;
			};
			t = m[j][i];
			for (let k = i; k < q; k += 1) {
				m[j][k] = m[j][k].sub(m[i][k].mul(t));
			};
		};
	};
	for (let i = 0; i < p; i += 1) {
		m[i] = m[i].slice(p);
	};
};

let w = 0;
let h = 0;
let yy = 0;
let outputCount = 0;
/** @type {string[]} */
let inputUrlArray = [];
/** @type {string[]} */
let outputUrlArray = null;
/** @type {HTMLCanvasElement[]} */
let canvasArray = null;
/** @type {ImageData[]} */
let dataArray = null;
/** @type {HTMLDivElement} */
let msgDiv = document.getElementById('msg-div');
/** @type {HTMLDivElement} */
let inputDiv = document.getElementById('input-div');
/** @type {HTMLDivElement} */
let outputDiv = document.getElementById('output-div');
/** @type {HTMLDivElement} */
let testDiv = document.getElementById('test-div');
/** @type {HTMLButtonElement} */
let uploadButton = document.getElementById('upload-button');
/** @type {HTMLButtonElement} */
let startButton = document.getElementById('start-button');

let showMask = () => {
	for (let i = 1; i < n; i += 1) {
		outputDiv.insertAdjacentHTML('beforeend', '<img src="' + outputUrlArray[i] + '">');
		testDiv.insertAdjacentHTML('beforeend', '<div style="' + [
			'position: absolute',
			'left: 0',
			'top: 0',
			'width: ' + w + 'px',
			'height: ' + h + 'px',
			'background-color: hsl(' + i * 137 % 360 + ', 80%, 70%)',
			'-webkit-mask-image: url(' + outputUrlArray[i] + ')',
			'mask-image: url(' + outputUrlArray[i] + ')',
		].join('; ') + '"></div>');
	};
	outputDiv.insertAdjacentHTML('beforeend', '<img src="' + outputUrlArray[0] + '">');
	testDiv.insertAdjacentHTML('beforeend', '<div style="' + [
		'position: absolute',
		'left: 0',
		'top: 0',
		'width: ' + w + 'px',
		'height: ' + h + 'px',
		'background-image: url(' + outputUrlArray[0] + ')',
	].join('; ') + '"></div>');
	msgDiv.textContent = '完成！';
	uploadButton.disabled = false;
	startButton.disabled = false;
};

let createMaskUrl = () => {
	for (let i = 0; i < n; i += 1) {
		canvasArray[i].getContext('2d').putImageData(dataArray[i], 0, 0);
		canvasArray[i].toBlob((blob) => {
			outputUrlArray[i] = URL.createObjectURL(blob);
			outputCount += 1;
			if (outputCount >= n) {
				setTimeout(showMask, 0);
			};
		});
	};
};

let createMask = () => {
	let stopTime = Date.now() + 200;
	let y = yy;
	let tFF = new QNum(255);
	do {
		if (y >= h) {
			yy = y;
			setTimeout(createMaskUrl, 0);
			return;
		};
		for (let x = 0; x < w; x += 1) {
			/** @type {QNum[]} */
			let u = new Array(n * 4);
			let i = (y * w + x) * 4;
			for (let j = 0; j < n; j += 1) {
				let r = dataArray[j].data[i + 0];
				let g = dataArray[j].data[i + 1];
				let b = dataArray[j].data[i + 2];
				let a = dataArray[j].data[i + 3];
				u[j * 4 + 0] = new QNum(r * a);
				u[j * 4 + 1] = new QNum(g * a);
				u[j * 4 + 2] = new QNum(b * a);
				u[j * 4 + 3] = new QNum(255 * (255 - a));
			};
			/** @type {QNum[]} */
			let v = new Array(3 + n);
			for (let j = 0; j < v.length; j += 1) {
				let t = new QNum();
				for (let k = 0; k < u.length; k += 1) {
					t = t.add(u[k].mul(m[j][k]));
				};
				v[j] = t;
			};
			let tt = v[3].div(tFF);
			for (let j = 1; j < n; j += 1) {
				let t = v[3 + j];
				tt = tt.add(t.div(tFF));
				dataArray[j].data[i + 0] = 0;
				dataArray[j].data[i + 1] = 0;
				dataArray[j].data[i + 2] = 0;
				dataArray[j].data[i + 3] = tt.val() > 0 ? t.div(tt).val() : 0;
			};
			tt = tFF.sub(tt);
			if (tt.val() > 0) {
				dataArray[0].data[i + 0] = v[0].div(tt).val();
				dataArray[0].data[i + 1] = v[1].div(tt).val();
				dataArray[0].data[i + 2] = v[2].div(tt).val();
				dataArray[0].data[i + 3] = tt.val();
			} else {
				dataArray[0].data[i + 0] = 0;
				dataArray[0].data[i + 1] = 0;
				dataArray[0].data[i + 2] = 0;
				dataArray[0].data[i + 3] = 0;
			};
		};
		y += 1;
	} while (Date.now() < stopTime);
	yy = y;
	msgDiv.textContent = '計算中 ' + (y * 100 / h).toFixed(2) + '%';
	setTimeout(createMask, 0);
	return;
};

uploadButton.addEventListener('click', (ev) => {
	let fileInput = document.createElement('input');
	fileInput.type = 'file';
	fileInput.accept = 'image/*';
	fileInput.addEventListener('change', (ev) => {
		let url = URL.createObjectURL(fileInput.files[0]);
		inputUrlArray.push(url);
		inputDiv.insertAdjacentHTML('beforeend', '<img src="' + url + '">');
	});
	fileInput.click();
});

startButton.addEventListener('click', (ev) => {
	uploadButton.disabled = true;
	startButton.disabled = true;
	let inputImgArray = Array.prototype.slice.call(inputDiv.getElementsByTagName('img'));
	n = inputImgArray.length;
	initMatrix();
	w = inputImgArray[0].naturalWidth;
	h = inputImgArray[0].naturalHeight;
	yy = 0;
	outputCount = 0;
	outputUrlArray = new Array(n);
	canvasArray = new Array(n);
	dataArray = new Array(n);
	for (let i = 0; i < n; i += 1) {
		let cvs = document.createElement('canvas');
		cvs.width = w;
		cvs.height = h;
		let ctx = cvs.getContext('2d');
		ctx.drawImage(inputImgArray[i], 0, 0, w, h);
		canvasArray[i] = cvs;
		dataArray[i] = ctx.getImageData(0, 0, w, h);
	};
	msgDiv.innerHTML = '計算中 ' + (0).toFixed(2) + '%';
	outputDiv.innerHTML = '';
	testDiv.innerHTML = '';
	setTimeout(createMask, 0);
});
