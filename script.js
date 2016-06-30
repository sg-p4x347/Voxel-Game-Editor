// Script: [script name]
// Developer: Gage Coates
// Date: [date]

// global input handler
var input = new Input();

// gets called once the html is loaded
function initialize() {
	
	// initialize the canvas variables
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	
	// image interpolation off for IE, Chrome, Firefox
	ctx.msImageSmoothingEnabled = false;
	ctx.imageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;

	// fit the canvas to the screen size
	ctx.canvas.width  = window.innerWidth-128;
	ctx.canvas.height = window.innerHeight-128;
	
	// add key listeners
	window.addEventListener('keydown', function (event) {
		input.keyDown(event);
	});
	window.addEventListener('keyup', function (event) {
		input.keyUp(event);
	});
	// add mouse listeners (only on the canvas)
	canvas.addEventListener('mousedown', function (event) {
		input.mouseDown(event);
	});
	canvas.addEventListener('mouseup', function (event) {
		input.mouseUp(event);
	});
	canvas.addEventListener('mousemove', function (event) {
		input.mouseMove(event);
	});
	canvas.addEventListener('mousewheel', function (event) {
		input.mouseWheel(event);
	});
	// add window listeners
	window.addEventListener('resize', function (event) {
		input.resize(event);
	});
}

// handle input events
function Input() {
	// input states
	this.keyMap = [];
	this.mouse = {
		xPos: 0,
		yPos: 0,
		left: false,
		middle: false,
		right: false
	}
	// set all keys to false
	for (var i = 0; i < 222; i++) {
		this.keyMap.push(false);
	}
	// key listeners
	this.keyDown = function (event) {
		event.preventDefault();
		this.keyMap[event.keyCode] = true;
	}
	this.keyUp = function (event) {
		event.preventDefault();
		this.keyMap[event.keyCode] = false;
	}
	// mouse listeners
	this.mouseDown = function (event) {
		event.preventDefault();
		switch (event.which) {
			case 1: this.mouse.left = true; break;
			case 2: this.mouse.middle = true; break;
			case 3: this.mouse.right = true; break;
		}
	}
	this.mouseUp = function (event) {
		event.preventDefault();
		switch (event.which) {
			case 1: this.mouse.left = false; break;
			case 2: this.mouse.middle = false; break;
			case 3: this.mouse.right = false; break;
		}
	}
	this.mouseMove = function (event) {
		event.preventDefault();
		var rect = canvas.getBoundingClientRect();
		this.mouse.xPos = event.clientX - rect.left;
		this.mouse.yPos = event.clientY - rect.top;
	}
	this.mouseWheel = function (event) {
		
	}
	// window listeners
	this.resize = function (event) {
		
	}
}


