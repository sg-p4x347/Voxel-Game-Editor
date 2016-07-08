// Script: Voxel Game Creator
// Developer: Gage Coates
// Date: July, 2016


// global input handler
var input = new Input();
// everything game related
var game = new Game();
var canvas;
var ctx;

// gets called once the html is loaded
function initialize() {
	// initialize the canvas variables
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	
	//  setup requestAnimFrame
	window.requestAnimFrame = (function () {
		return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000/60);
		};
	})();
	
	input.Initialize(canvas);
	game.Initialize();
}

function Game () {
	// data
	this.name = 'game1';
	this.level = 0;
	this.levels = [];
	this.camera = new Vector(5,32);
	this.mode = 'edit';
	this.primarySelection = null;
	this.entityGhost = new Image();
	this.layer = 'foreground';
	this.layers = [];
	this.entityTypes = ['Player','Checkpoint','Saw','Bullet'];
	// HTML
	this.fps;
	this.blockSelection;
	// animation variables
	this.animationRequest;
	this.timeOfLastFrame;
	this.deltaTime;
	// rendering constants
	this.view = {
		width: 16,
		height: 24
	}
	this.viewScale = new Vector()
	// assets
	this.blockSheet = new Image();
	this.undefined = new Image();
	this.blockWidth = 8;
	// slower 1/10 second update
	this.tickCounter = 0;
	this.Tick = function () {
		var self = this;
		// sprite animation
		self.levels[self.level].entities.forEach(function (entity) {
			if (entity !== null) {
				if (entity.Animate) {
					entity.Animate();
				}
				if (entity.AI) {
					entity.AI(self.levels[self.level]);
				}
			}
		});
	}
	// fast 1/60 second update
	this.Update = function () {
		var self = this;
		
		// movement
		switch (self.mode) {
			case 'edit':
				var velocity = self.view.height*0.01;
				// x
				if (input.action.right && !input.action.left) {
					self.camera.x += velocity;
				} else if ( input.action.left && !input.action.right) {
					self.camera.x -= velocity;
				}
				// y
				if (input.action.down && !input.action.up) {
					self.camera.y += velocity;
				} else if ( input.action.up && !input.action.down) {
					self.camera.y -= velocity;
				}
				break;
			case 'play':
				if (self.levels[self.level].entities[0] === undefined) {
					self.mode = 'edit';
					self.camera = new Vector(0,0);
					break;
				}
				self.camera = self.levels[self.level].entities[0].position;
				// update entities
				self.levels[self.level].entities.forEach(function (entity,index) {
					if (entity !== null) {
						entity.Update(self.deltaTime,self.levels[self.level]);
					}
				});
				// tick updates
				if (self.tickCounter > 6) {
					self.tickCounter = 0;
				}
				if (self.tickCounter == 0) {
					self.Tick();
				}
				self.tickCounter++;
				break;
		}
		// info
		self.fps.innerHTML = 'FPS: ' + Math.round(1/self.deltaTime);
	}
	this.Render = function () {
		var self = this;
		// clear the screen
		ctx.fillStyle = 'rgb(192,192,255)';
		ctx.fillRect(0,0,canvas.width,canvas.height);
		// the view
		var topLeft = new Vector(self.camera.x - self.view.width/2,self.camera.y - self.view.height/2);
		/*for (var y = Math.round(topLeft.y) ; y < Math.round(topLeft.y) + self.view.height + 1 ; y++) {		
			for (var x = Math.round(topLeft.x) ; x < Math.round(topLeft.x) + self.view.width + 1; x++) {
				var xCoord = Math.round((x - topLeft.x) * self.viewScale.x);
				var yCoord = Math.round((y - topLeft.y) * self.viewScale.y);
				if (x >= 0 && x < self.levels[self.level].width && y >= 0 && y < self.levels[self.level].height) {
					var sy = Math.floor(self.levels[self.level].foreground[x][y].data / (self.blockSheet.width/self.blockWidth));
					var sx = self.levels[self.level].foreground[x][y].data - (sy * (self.blockSheet.width/self.blockWidth));
					ctx.drawImage(self.blockSheet, sx * self.blockWidth, sy * self.blockWidth, self.blockWidth, self.blockWidth, Math.floor(xCoord-self.viewScale.x/2), Math.floor(yCoord-self.viewScale.y/2), self.viewScale.x, self.viewScale.y);
				}
			}
		} */
		var x = Math.round(topLeft.x);
		var y = Math.round(topLeft.y);
		for (var yCoord = Math.round((y - topLeft.y) * self.viewScale.y) ; yCoord < canvas.height + self.viewScale.y ; yCoord+= self.viewScale.y) {		
			for (var xCoord = Math.round((x - topLeft.x) * self.viewScale.x); xCoord < canvas.width + self.viewScale.x ; xCoord += self.viewScale.x) {
				var screenX = Math.floor(xCoord-self.viewScale.x/2);
				var screenY = Math.floor(yCoord-self.viewScale.y/2);
				if (x >= 0 && x < self.levels[self.level].width && y >= 0 && y < self.levels[self.level].height) {
					if (document.getElementById('backgroundVis').checked && self.levels[self.level].GetForeground(x,y)=== 0 && self.levels[self.level].GetBackground(x,y) !== 0) {
						// background
						var sy = Math.floor(self.levels[self.level].GetBackground(x,y) / (self.blockSheet.width/self.blockWidth));
						var sx = self.levels[self.level].GetBackground(x,y) - (sy * (self.blockSheet.width/self.blockWidth));
						ctx.drawImage(self.blockSheet, sx * self.blockWidth, sy * self.blockWidth, self.blockWidth, self.blockWidth, screenX,screenY, self.viewScale.x, self.viewScale.y);
						ctx.fillStyle = 'rgba(0,0,0,0.5)';
						ctx.fillRect(screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
					if (document.getElementById('foregroundVis').checked && self.levels[self.level].GetForeground(x,y) !== 0) {
						// foreground
						var sy = Math.floor(self.levels[self.level].GetForeground(x,y) / (self.blockSheet.width/self.blockWidth));
						var sx = self.levels[self.level].GetForeground(x,y) - (sy * (self.blockSheet.width/self.blockWidth));
						ctx.drawImage(self.blockSheet, sx * self.blockWidth, sy * self.blockWidth, self.blockWidth, self.blockWidth, screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
					// collision
					if (document.getElementById('collisionVis').checked ) {
						switch (self.levels[self.level].GetCollision(x,y)) {
							case 0: ctx.fillStyle = 'rgba(0,0,255,0.5)'; break;
							case 1: ctx.fillStyle = 'rgba(255,0,0,0.5)'; break;
						}
						ctx.fillRect(screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
				} else {
					ctx.drawImage(self.undefined,0,0,8,8,screenX,screenY,self.viewScale.x,self.viewScale.y);
				}
				x++;
			}
			x = Math.round(topLeft.x);
			y++;
		}
		ctx.fillRect(0,0,4,4);
		// placement
		switch (self.mode) {
			case 'edit':
				var coord = ScreenToGame(new Vector(input.mouse.xPos,input.mouse.yPos));
				coord.Round();
				if (typeof self.primarySelection === 'number') {
					// place block
					var penSize = parseInt(document.getElementById('penSize').value);
					for ( var y = Math.round(coord.y-penSize/2); y < Math.round(coord.y+penSize/2); y++) {
						for (var x = Math.round(coord.x - penSize/2); x < Math.round(coord.x + penSize/2);x++) {
							if (input.mouse.left) {
								self.PlaceBlock(self.layer,new Vector(x,y),self.primarySelection);
							}
							// block highlight
							var screenCoord = GameToScreen(new Vector(x,y));
							ctx.fillStyle = 'rgba(255,255,255,0.25)';
							ctx.fillRect(Math.floor(screenCoord.x-self.viewScale.x/2), Math.floor(screenCoord.y-self.viewScale.y/2), self.viewScale.x, self.viewScale.y);
						}
					}
				} else if (typeof self.primarySelection === 'string') {
					// place entity
					coord.Add(new Vector(+0.5,+0.5));
					if (input.mouse.left) {
						var entity = new window[self.primarySelection](coord.x,coord.y);
						switch (self.primarySelection) {
							case 'Player':
							entity.respawn = coord;
							self.levels[self.level].entities[0] = entity;
							break;
							default: self.levels[self.level].entities.push(entity);
						}
						input.mouse.left = false;
					}
					// entity ghost
					coord.Add(new Vector(-1,-1));
					var screenCoord = GameToScreen(coord);
					ctx.drawImage(self.entityGhost,0,0,16,16,screenCoord.x,screenCoord.y,2*self.viewScale.x,2*self.viewScale.y);
				}
			break;
		}
		// entities
		if (document.getElementById('entityVis').checked) {
			for (var i = self.levels[self.level].entities.length -1; i >= 0; i--) {
				var entity = self.levels[self.level].entities[i]
				if (entity !== null && !entity.dead)
				entity.Render();
			}
		}
	}
	this.UpdateLevel = function () {
		var self = this;
		// remove levels from level list
		var levels = document.getElementById('levelSelect');
		while (levels.firstChild) {
			levels.removeChild(levels.firstChild);
		}
		// restore levels
		self.levels.forEach(function (level,index) {
			var option = document.createElement('OPTION');
			option.value = index;
			option.innerHTML = level.name;
			if (index == self.level) {
				option.selected = true;
			}
			levels.appendChild(option);
		});
	}
	this.Export = function () {
		var self = this;
		var levels = [];
		self.levels.forEach(function (level) {
			levels.push(level.Export());
		});
		return {name:self.name,levels:levels};
	}
	this.Import = function (gameData) {
		var self = this;
		self.mode = 'edit';
		self.name = gameData.name;
		self.levels = [];
		self.level = 0;
		gameData.levels.forEach(function (levelData) {
			var level = new Level();
			level.Import(levelData);
			self.levels.push(level);
		});
		if (self.levels[self.level].entities[0] !== undefined) {
			self.camera = new Vector(self.levels[self.level].entities[0].position.x,self.levels[self.level].entities[0].position.y);
		}
	}
	this.PlaceBlock = function (layer,coord,data) {
		var self = this;
		self.levels[self.level].SetLayer(coord.x,coord.y,layer,data);
		if (layer === 'foreground') {
			self.levels[self.level].SetLayer(coord.x,coord.y,'collision',data > 0 ? 1:0);
		}
	}
	this.UpdateView = function () {
		var self = this;
		// fit the canvas to the screen size
		var rect = canvas.getBoundingClientRect();
		var toolBar = document.getElementById('toolBar');
		toolBar.style.height = (window.innerHeight-rect.top-16).toString() + 'px';
		canvas.width  = toolBar.getBoundingClientRect().left-16;
		canvas.height = window.innerHeight-rect.top-16;
		// image interpolation off for IE, Chrome, Firefox
		ctx.msImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		// update game variables
		self.view.width = (self.view.height * (canvas.width/canvas.height));
		self.viewScale.y = Math.round(canvas.height/self.view.height);
		self.viewScale.x = self.viewScale.y;
	}
	this.Animation = function () {
		var self = this;
		self.deltaTime = (Date.now() - self.timeOfLastFrame)/1000;
		self.timeOfLastFrame = Date.now();
		if (self.levels[self.level] !== undefined) {
			self.Update();
			self.Render();
		}
		self.animationRequest = window.requestAnimFrame(function () {
			self.Animation();
		});
	}
	this.Stop = function() {
		window.cancelAnimationFrame(this.animationRequest);
	}
	this.Initialize = function () {
		var self = this;
		self.levels.push(new Level('level 1',64,64));
		// load assets
		self.blockSheet.src = 'textures/blockSheet.png';
		self.blockSheet.width = 128;
		self.blockSheet.height = 128;
		self.undefined.src = 'textures/undefined.png';
		// HTML
		self.fps = document.getElementById('fps');
		// Block Selection
		self.blockSelection = document.getElementById('blockSelection');
		for (var y = 0; y < (self.blockSheet.width/self.blockWidth); y ++) {
			var row = document.createElement('TR');
			for (var x = 0; x < (self.blockSheet.width/self.blockWidth); x++) {
				var data = document.createElement('TD');
				data.className = 'selection';
				data.onmousedown = function () {
					this.className = 'newSeleted';
					for (var r = 0, row; row = self.blockSelection.rows[r]; r++) {
						for (var c = 0, cell; cell = row.cells[c]; c++) {
							if (cell.className == 'newSeleted') {
								// set this to the block 
								self.primarySelection = Math.round(c) + (Math.round(r) * (self.blockSheet.width/self.blockWidth)) 
								cell.className = 'selected';
							} else {
								cell.className = 'selection';
							}
						}
					}
				}
				row.appendChild(data);
			}
			self.blockSelection.appendChild(row);
		}
		// Entity Selection
		var entitySelect = document.getElementById('entitySelect');
		self.entityTypes.forEach(function (entity) {
			var option = document.createElement('OPTION');
			option.innerHTML = entity;
			option.value = entity;
			entitySelect.appendChild(option);
		});
		entitySelect.onclick = function () {
			self.primarySelection = this.value;
			self.entityGhost.src = 'textures/' + this.value + '.png';
		}
		// Layers
		self.layers.push({button:document.getElementById('entities'),visibility:document.getElementById('entityVis')});
		self.layers.push({button:document.getElementById('foreground'),visibility:document.getElementById('foregroundVis')});
		self.layers.push({button:document.getElementById('background'),visibility:document.getElementById('backgroundVis')});
		self.layers.push({button:document.getElementById('collision'),visibility:document.getElementById('collisionVis')});
		
		self.layers.forEach(function (layer ) {
			layer.button.onclick = function () {
				self.layers.forEach(function (otherLayer) {
					otherLayer.button.className = 'button layer';
				});
				this.className = 'selectedLayer button layer';
				self.layer = this.id;
				if (self.layer === 'entities') {
					document.getElementById('blockSelection').hidden = true;
				} else {
					document.getElementById('blockSelection').hidden = false;
				}
			};
		});
		self.layers[1].button.onclick();
		// Export
		var button = document.getElementById('export');
		button.onclick = function () {
			if (self.mode === 'play') {
				document.getElementById('mode').onclick();
			}
			self.levels[self.level].Reset();
			var json = JSON.stringify(self.Export());
			json = 'gameData = ' + json;
			var blob = new Blob([json], {type: "application/js"});
			var url  = URL.createObjectURL(blob);
			button.download = document.getElementById('gameName').value + ".js";
			button.href = url;
		}
		// Import
		
		var importButton = document.getElementById('import');
		importButton.onclick = function () {
			document.getElementById('gameData').remove();
			var gameScript = document.createElement('SCRIPT');
			gameScript.onload = function () {
				self.Import(gameData);
			}
			gameScript.id = 'gameData';
			gameScript.type = 'text/javascript';
			gameScript.src = 'levels/' +  document.getElementById('gameName').value + '.js';
			document.getElementsByTagName('head')[0].appendChild(gameScript);
		};
		
		// Toggle mode
		var modeButton = document.getElementById('mode')
		modeButton.onclick = function () {
			if (self.mode === 'play') {
				self.mode = 'edit';
				self.camera = new Vector(self.camera.x,self.camera.y);
				modeButton.innerHTML = 'Play';
			} else if (self.mode === 'edit') {
				self.mode = 'play';
				self.camera = self.levels[self.level].entities[0].position;
				modeButton.innerHTML = 'Edit';
			}
			self.levels[self.level].Reset();
		}
		// Select level
		document.getElementById('levelSelect').onchange = function () {
			self.level = parseInt(document.getElementById('levelSelect').value);
		}
		// Add level
		document.getElementById('addLevel').onclick = function () {
			var width = parseInt(document.getElementById('levelWidth').value);
			var height = parseInt(document.getElementById('levelHeight').value);
			if (typeof width === 'number'  && typeof height === 'number' && width * height <= 16384) {
				self.levels.push(new Level(document.getElementById('levelName').value,Math.round(width),Math.round(height)));
				self.level = self.levels.length-1;
				self.camera = new Vector(0,0);
				self.UpdateLevel();
			}
		}
		// Remove level
		document.getElementById('removeLevel').onclick = function () {
			var levels = [];
			self.levels.forEach(function (level,index) {
				if (index != self.level) {
					levels.push(level);
				}
			});
			self.levels = levels;
			if (self.level >= self.levels.length) {
				self.level = self.levels.length-1;
			}
			self.UpdateLevel();
		}
		// begin animation loop
		input.GetMouseWheel(function (event) {
			if (event.wheelDelta > 0) {
				self.view.height--;
			} else {
				self.view.height++;
			}
			self.UpdateView();
		});
		self.UpdateView();
		self.UpdateLevel();
		self.timeOfLastFrame = Date.now();
		self.Animation();
	}
}
function Level (name, width, height) {
	this.name = name;
	this.width = width;
	this.height = height;
	
	this.foreground = [];
	this.background = [];
	this.collision = [];
	
	this.entities = [new Player(2,2)];
	
	this.Reset = function () {
		var self = this;
		self.entities.forEach(function (entity,index) {
			if (entity !== null) {
				if (entity.type === 'Bullet') {
					self.entities[index] = null;
				} else {
					entity.Death();
					entity.Respawn();
				}
			}
		});
	}
	this.Export = function () {
		var self = this;
		var entities = [];
		self.entities.forEach(function (entity) {
			if (entity !== null) {
				entities.push(entity.Export());
			}
		});
		return {name: self.name, width: self.width, height: self.height,foreground: Compress(self.foreground), background: Compress(self.background), collision: Compress(self.collision), entities: entities}
	}
	this.Import = function (data) {
		var self = this;
		// properties
		self.name = data.name;
		self.width = data.width;
		self.height = data.height;
		// map
		self.foreground = UnCompress(data.foreground);
		self.background = UnCompress(data.background);
		self.collision = UnCompress(data.collision);
		// entities
		self.entities = [];
		data.entities.forEach(function (entityData) {
			var entity;
			entity = new window[entityData.type];
			entity.Import(entityData);
			self.entities.push(entity);
		});
	}
	this.GetIndex = function (x,y) {
		return y*this.width + x;
	}
	this.GetForeground = function (x,y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return this.foreground[this.GetIndex(x,y)];
		} else {
			return 0;
		}
	}
	this.GetBackground = function (x,y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return this.background[this.GetIndex(x,y)];
		} else {
			return 0;
		}
	}
	this.GetCollision = function (x,y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return this.collision[this.GetIndex(x,y)];
		} else {
			return 1;
		}
	}
	this.SetLayer = function (x,y,layer,data) {
		if (typeof data === 'number' && this.hasOwnProperty(layer) && x >= 0 && x < this.width && y >= 0 && y < this.height) {
			this[layer][this.GetIndex(x,y)] = data;
		}
	}
	this.Initialize = function () {
		var self = this;
		for (var y = 0; y < self.height; y ++) {
			for (var x = 0; x < self.width; x ++) {
				if (y == 32) {
					self.foreground.push(2)
					self.collision.push(1);
				} else if (y > 32){
					self.foreground.push(1)
					self.collision.push(1);
				} else {
					self.foreground.push(0)
					self.collision.push(0);
				}
				self.background.push(0);
			}
		}
	}
	this.Initialize();
}
function Vector (x,y) {
	this.x = x;
	this.y = y;
	this.Export = function () {
		return {x:this.x,y:this.y};
	}
	this.Import = function (vectorData) {
		this.x = vectorData.x;
		this.y = vectorData.y;
	}
	this.Add = function (vector) {
		this.x += vector.x;
		this.y += vector.y;
	}
	this.Round = function () {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
	}
	this.Scalar = function (scalar) {
		return new Vector(this.x * scalar,this.y * scalar);
	}
}
// Base Entity class
function Entity (x,y,width,height,sheet) {
	this.type = 'Entity';
	this.sheet = sheet;
	this.spriteSheet = new Image();
	this.respawn = new Vector(x,y);
	this.dead = false;
	this.mass = 1;
	this.width = width;
	this.height = height;
	this.direction = 1;
	this.uv = new Vector(0,0);
	this.uvSize = new Vector(2,2);
	this.force = new Vector(0,0);
	this.position = new Vector(x,y);
	this.velocity = new Vector(0,0);
	this.acceleration = new Vector(0,0);
	this.collision = {left:false,right:false,top:false,bottom:false};
	this.Death = function () {
		this.dead = true;
		this.state = 0;
		this.frame = 0;
		this.uv = new Vector(0,0);
		this.velocity = new Vector(0,0);
	}
	this.Respawn = function () {
		this.dead = false;
		this.state = 0;
		this.frame = 0;
		this.uv = new Vector(0,0);
		this.velocity = new Vector(0,0);
		this.position.x = this.respawn.x;
		this.position.y = this.respawn.y;
	}
	this.OnCollision = function (entity) {
		
	}
	this.Render = function () {
		var self = this;
		if (!self.dead) {
			var screen = GameToScreen(self.position);
			ctx.save();
			if (self.direction === -1) {
				var coord = GameToScreen(self.position);
				ctx.translate(coord.x,coord.y);
				ctx.scale(-1,1);
				ctx.translate(-coord.x,-coord.y);
			}
			ctx.drawImage(self.spriteSheet,self.uv.x,self.uv.y,self.uvSize.x*game.blockWidth,self.uvSize.y*game.blockWidth,screen.x-(game.viewScale.x*self.uvSize.x/2),screen.y-(game.viewScale.y*self.uvSize.y/2),self.uvSize.x*game.viewScale.x,self.uvSize.y*game.viewScale.y);
			ctx.restore();
		}
	}
	this.Collision = function (box1,box2) {
		var collision = new Vector(0,0);
		var box1Right = box1.x+box1.width;
		var box1Bottom = box1.y+box1.height;
		var box2Right = box2.x+box2.width
		var box2Bottom = box2.y+box2.height;
		if (box2.x < box1Right && box2Right > box1.x
				&& box2.y < box1Bottom && box2Bottom > box1.y) {
			if (box1.x + (box1.width / 2) >= box2.x + (box2.width / 2)) {
				// left collision
				collision.x = box1.x - box2Right;
			} else if (box1.x + (box1.width / 2) < box2.x + (box2.width / 2)) {
				// right collision
				collision.x = box1Right - box2.x;
			}
			if (box1.y + (box1.height / 2) < box2.y + (box2.height / 2)) {
				// bottom collision
				collision.y = box1Bottom - box2.y;			
			} else if (box1.y + (box1.height / 2) >= box2.y + (box2.height / 2)) {
				// top collision
				collision.y = box1.y - box2Bottom;
			}			
		}
		return collision;
	}
	this.Initialize = function () {
		if (this.sheet !== undefined) {
			this.spriteSheet.src = this.sheet;
		}
	}
	this.Initialize();
}
Entity.prototype.Update = function (deltaTime,level) {
	var self = this;
	if (!self.dead) {
		// impulses
		self.force.y += self.mass * 32;
		self.acceleration.x = self.mass > 0 ? self.force.x / self.mass : 0;
		self.acceleration.y = self.mass > 0 ? self.force.y / self.mass : 0;
		self.force.x = 0;
		self.force.y = 0;
		// update velocity
		self.velocity.x += self.acceleration.x * deltaTime;
		self.velocity.y += self.acceleration.y * deltaTime;
		// update position
		self.position.Add(self.velocity.Scalar(deltaTime));
		// check for block collision
		self.collision = {left:false,right:false,top:false,bottom:false};
		for (var iY = Math.round(self.position.y - self.height/2); iY <= Math.round(self.position.y + self.height/2); iY++ ){
			for (var iX = Math.round(self.position.x - self.width/2 - 0.5); iX <= Math.round(self.position.x + self.width + 0.5); iX++ ) {
				if (level.GetCollision(iX,iY)) {
					var collision = self.Collision({x:self.position.x-self.width/2,y:self.position.y-self.height/2,width:self.width,height:self.height},{x:iX-0.5,y:iY-0.5,width:1,height:1});
					if (collision.x != 0 && collision.y != 0) {
						if (Math.abs(collision.x) >= Math.abs(collision.y)) {
							// vertical collision
							
							self.position.y -= collision.y;
							self.velocity.y = 0;
							if (collision.y > 0) {
								self.collision.bottom = true;
							} else if (collision.y < 0) {
								self.collision.top = true;
							}
							collision = self.Collision({x:self.position.x-self.width/2,y:self.position.y-self.height/2,width:self.width,height:self.height},{x:iX-0.5,y:iY-0.5,width:1,height:1});
							if (Math.abs(collision.x) > 0) {
								
								self.position.x -= collision.x;
								self.velocity.x = 0;
								if (collision.x > 0) {
									self.collision.right = true;
								} else if (collision.x < 0) {
									self.collision.left = true;
								}
							}
						} else if (Math.abs(collision.x) < Math.abs(collision.y)) {
							// horizontal collision
							
							self.position.x -= collision.x;
							self.velocity.x = 0;
							if (collision.x > 0) {
								self.collision.right = true;
							} else if (collision.x < 0) {
								self.collision.left = true;
							}
							
							collision = self.Collision({x:self.position.x-self.width/2,y:self.position.y-self.height/2,width:self.width,height:self.height},{x:iX-0.5,y:iY-0.5,width:1,height:1});
							if (Math.abs(collision.y) > 0) {
								
								self.position.y -= collision.y;
								self.velocity.y = 0;
								if (collision.y > 0) {
									self.collision.bottom = true;
								} else if (collision.y < 0) {
									self.collision.top = true;
								}
							}
						}
					}
				}
			}
		}
		// check for entity collision
		level.entities.forEach(function (entity) {
			if (entity !== self && entity !== null && !entity.dead) {
				var collision = self.Collision({x:self.position.x-self.width/2,y:self.position.y-self.height/2,width:self.width,height:self.height},
				{x:entity.position.x-entity.width/2,y:entity.position.y-entity.height/2,width:entity.width,height:entity.height});
				if (collision.x != 0 || collision.y != 0) {
					self.OnCollision(entity);
					entity.OnCollision(self);
				}
			}
		});
	}
}
Entity.prototype.Export = function () {
	var self = this;
	return {type: self.type,sheet: self.sheet, respawn: self.respawn.Export(), dead: self.dead,mass: self.mass, width: self.width, height: self.height, direction:self.direction, uv: self.uv.Export(), uvSize: self.uvSize.Export(),force: self.force.Export(),position:self.position.Export(),
	velocity:self.velocity.Export(), acceleration:self.acceleration.Export(),collision:self.collision};
}
Entity.prototype.Import = function (entityData) {
	var self = this;
	self.sheet = entityData.sheet;
	self.respawn = new Vector();
	self.respawn.Import(entityData.respawn);
	self.dead = entityData.dead;
	self.mass = entityData.mass;
	self.width = entityData.width;
	self.height = entityData.height;
	self.direction = entityData.direction;
	self.uv = new Vector();
	self.uv.Import(entityData.uv);
	self.uvSize = new Vector();
	self.uvSize.Import(entityData.uvSize);
	self.force = new Vector();
	self.force.Import(entityData.force);
	self.position = new Vector();
	self.position.Import(entityData.position);
	self.velocity = new Vector();
	self.velocity.Import(entityData.velocity);
	self.acceleration = new Vector();
	self.acceleration.Import(entityData.acceleration);
	self.collision = entityData.collision;
	self.Initialize();
}
// All things that are alive
function NPC (x,y,width,height,sheet,speed) {
	Entity.call(this, x, y,width,height, sheet);
	this.type = 'NPC';
	this.state = 0;
	this.frame = 0;
	this.speed = speed;
	this.coolDown = 2;
	this.lastFire = this.coolDown;
	this.MoveRight = function () {
		if (!this.collision.right) {
			this.velocity.x = this.speed;
		}
		this.direction = 1;
	}
	this.MoveLeft = function () {
		if (!this.collision.left) {
			this.velocity.x = -this.speed;
		}
		this.direction = -1;
	}
	this.Stop = function () {
		this.velocity.x = 0;
	}
	this.Jump = function () {
		if (this.collision.bottom) {
			this.velocity.y = -17;
		}
	}
	this.Kill = function () {
		if (this.state != 3) {
			this.frame = 0;
			this.state = 3;
			this.Stop();
		}
	}
	this.Shoot = function (level) {
		if (this.lastFire >= this.coolDown) {
			var bullet = new Bullet(this.position.x+this.direction*(this.width/2+1),this.position.y);
			bullet.velocity.x = this.direction*20;
			level.entities.push(bullet);
			this.lastFire = 0;
		}
	}
	this.Animate = function () {
		var self = this;
		if (!self.dead) {
			var lastState = self.state;
			// update the sprite state (idle, run, jump)
			if (self.state != 3) {
				if (Math.abs(self.velocity.x) != 0) {
					self.state = 1;
				}  else {
					self.state = 0;
				}
				if (Math.abs(self.velocity.y) != 0) {
					self.state = 2;
				}
			}
			if (lastState !== self.state) {
				self.frame = 0;
			}
			
			if (self.frame < 7) {
				self.frame++;
			} else {
				// dead
				if (self.state === 3) {
					self.Death();
				}
				self.frame = 0;
			}
			self.uv.x = self.frame * 16;
			self.uv.y = self.state * 16;
		}
	}
}
NPC.prototype.Update = function (deltaTime,level) {
	var self = this;
	Entity.prototype.Update.call(this,deltaTime,level);
	self.lastFire+=deltaTime;
}
NPC.prototype.Export = function () {
	var self = this;
	var obj = Entity.prototype.Export.call(this);
	obj.state = self.state;
	obj.frame = self.frame;
	obj.speed = self.speed;
	return obj;
}
NPC.prototype.Import = function (NPCdata) {
	var self = this;
	Entity.prototype.Import.call(this,NPCdata);
	self.state = NPCdata.state;
	self.frame = NPCdata.frame;
	self.speed = NPCdata.speed;
}
// You
function Player (x,y) {
	// inherits from NPC
	NPC.call(this, x, y,1,2,'textures/Player.png',10);
	this.type = 'Player';
	this.coolDown = 1;
	this.OnCollision = function (entity) {
		var self = this;
		if (entity instanceof Hostile || entity.type == 'Bullet') {
			self.Kill();
		} else if (entity.type == 'Checkpoint') {
			self.respawn = entity.position;
		}
	}
}
Player.prototype.Death = function () {
	Entity.Death.call(this);
	this.Respawn();
}
Player.prototype.Update = function (deltaTime,level) {
	var self = this;
	if (!self.dead) {
		if (self.state !== 3) {
			// x
			if (input.action.right && !input.action.left) {
				self.MoveRight();
			} else if ( input.action.left && !input.action.right) {
				self.MoveLeft();
			} else {
				self.Stop();
			}
			// y
			if (input.action.space || input.action.up) {
				self.Jump();
			}
			// fire
			if (input.mouse.left) {
				self.Shoot(level);
				input.mouse.left = false;
			}
		} 
		NPC.prototype.Update.call(this,deltaTime,level);
	} else {
		self.Respawn();
	}
}
Player.prototype.Export = function () {
	return NPC.prototype.Export.call(this);
}
Player.prototype.Import = function (playerData) {
	NPC.prototype.Import.call(this,playerData);
}
// Bad guys
function Hostile (x,y,width,height,sheet,speed,range,jump) {
	// inherits from NPC
	NPC.call(this, x, y,width,height,sheet,speed);
	this.type = 'Hostile';
	this.range = range;
	this.jump = jump;
	this.OnCollision = function (entity) {
		if (entity.type == 'Bullet') {
			this.Kill();
		}
	}
	this.AI = function (level) {
		var self = this;
		if (!self.dead && self.state !== 3) {
			var player = level.entities[0];
			if (player.state !== 3) {
				var distance = player.position.x - self.position.x 
				if (Math.abs(distance) > 1 && Math.abs(distance) < self.range) {
					if (Math.abs(self.velocity.x) < 0.5) {
						self.CheckJump(level);
					}
					if ( distance > 0) {
						self.MoveRight();
						self.Shoot(level);
					} else if (distance < 0) {
						self.MoveLeft();
						self.Shoot(level);
					} else {
						self.Stop();
					}
					
				} else {
					self.Stop();
				}
			} else {
				self.Stop();
			}
		} else {
			self.Stop();
		}
	}
	this.CheckJump = function (level) {
		var self = this;
		if (self.jump) {
			for (var y = Math.round(self.position.y-0.5); y>Math.round(self.position.y-0.5)-4; y--) {
				if (!level.GetCollision(Math.round(self.position.x+self.direction),y)&&!level.GetCollision(Math.round(self.position.x+self.direction),y-1)) {
					self.Jump();
				}
			}
		}
	}
}
Hostile.prototype.Update = function (deltaTime,level) {
	var self = this;
	var velocity = 5;
	NPC.prototype.Update.call(this,deltaTime,level);
	if (self.state === 3 && self.frame === 7) {
		self.Death();
	}
}
Hostile.prototype.Export = function () {
	var self = this;
	var obj = NPC.prototype.Export.call(this);
	obj.range = self.range;
	obj.jump = self.jump;
	return obj;
}
Hostile.prototype.Import = function (hostileData) {
	var self = this;
	NPC.prototype.Import.call(this,hostileData);
	self.range = hostileData.range;
	self.jump = hostileData.jump;
}
function Saw (x,y) {
	var entity =  new Hostile(x,y,2,1.5,'textures/Saw.png',5,16,false);
	entity.type = 'Saw';
	return entity;
}
function Checkpoint (x,y) {
	var checkpoint = new Entity(x,y,2,2,'textures/Checkpoint.png');
	checkpoint.type = 'Checkpoint';
	checkpoint.mass = 0;
	return checkpoint;
}
function Bullet (x,y) {
	var bullet = new Entity(x,y,1,0.25,'textures/Bullet.png');
	bullet.type = 'Bullet';
	bullet.uvSize = new Vector(1,0.25);
	bullet.mass = 0;
	bullet.OnCollision = function (entity) {
		bullet.Death();
	}
	return bullet;
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
	// keybindings
	this.binding = {
		left: [65,37],
		right: [68,39],
		up: [87,38],
		down: [83,40],
		space: [32],
		shift: [16],
		escape: [27]
	}
	// interface
	this.action = {
		left: false,
		right: false,
		up: false,
		down: false,
		space: false,
		shift: false,
		escape: false
	}
	this.UpdateAction = function () {
		var self = this;
		for (var action in self.action) {
			self.binding[action].some(function (keyCode) {
				if (self.keyMap[keyCode]) {
					self.action[action] = true;
					return true;
				} else {
					self.action[action] = false;
				}
			})
		}
	}
	this.GetMouseWheel = function (callback) {
		canvas.addEventListener('mousewheel', function (event) {
			callback(event);
		});
	}
	this.Initialize = function (canvas) {
		var self = this;
		// set all keys to false
		for (var i = 0; i < 222; i++) {
			this.keyMap.push(false);
		}
		// add key listeners
		window.addEventListener('keydown', function (event) {
			//event.preventDefault();
			self.keyMap[event.keyCode] = true;
			self.UpdateAction();
		});
		window.addEventListener('keyup', function (event) {
			//event.preventDefault();
			self.keyMap[event.keyCode] = false;
			self.UpdateAction();
		});
		// add mouse listeners (only on the canvas)
		canvas.addEventListener('mousedown',  function (event) {
			event.preventDefault();
			switch (event.which) {
				case 1: self.mouse.left = true; break;
				case 2: self.mouse.middle = true; break;
				case 3: self.mouse.right = true; break;
			}
		});
		canvas.addEventListener('mouseup', function (event) {
			event.preventDefault();
			switch (event.which) {
				case 1: self.mouse.left = false; break;
				case 2: self.mouse.middle = false; break;
				case 3: self.mouse.right = false; break;
			}
		});
		canvas.addEventListener('mousemove', function (event) {
			event.preventDefault();
			var rect = canvas.getBoundingClientRect();
			self.mouse.xPos = event.clientX - rect.left;
			self.mouse.yPos = event.clientY - rect.top;
		});
		
		// add window listeners
		window.addEventListener('resize', function (event) {
			game.UpdateView();
		});
	}
}
// Utility
function Compress(array) {
	var compressed = [];
	var lastData = undefined;
	array.forEach(function (data) {
		if (data === lastData) {
			// increment counter
			compressed[compressed.length-1][0]++;
		} else {
			// setup new block of data
			compressed.push([1,data]);
		}
		lastData = data;
	});
	return compressed;
}
function UnCompress(array) {
	var original = [];
	array.forEach(function (sub) {
		for(var i = 0; i < sub [0]; i++) {
			original.push(sub[1]);
		}
	});
	return original;
}
function ScreenToGame(screen) {
	var self = this;
	return new Vector(
		((screen.x - canvas.width/2) / game.viewScale.x) + game.camera.x,
		((screen.y - canvas.height/2) / game.viewScale.y) + game.camera.y
	)
}
function GameToScreen(vector) {
	var self = this;
	return new Vector (
		Math.round((vector.x - game.camera.x +game.view.width/2) * game.viewScale.x),
		Math.round((vector.y - game.camera.y+game.view.height/2) * game.viewScale.y)
	);
}
function loadJSON(callback) {   
	var xobj = new XMLHttpRequest();
	xobj.overrideMimeType("application/json");
	xobj.open('GET', 'levels/game1.json', true); // Replace 'my_data' with the path to your file
	xobj.onreadystatechange = function () {
		  if (xobj.readyState == 4 && xobj.status == "200") {
			// Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
			callback(xobj.responseText);
		  }
	};
	xobj.send(null);  
}