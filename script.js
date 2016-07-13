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
	this.version = 0;
	this.level = 0;
	this.levels = [];
	this.camera;
	this.pause = false;
	this.mode = 'edit';
	this.primarySelection = null;
	this.entityGhost;
	this.layer = 'foreground';
	this.layers = [];
	this.entityTypes = ['Player','Exit','Checkpoint','Turret','Saw','Seeker','Gage','Acid','Remove'];
	// HTML
	this.fps;
	this.toolBar;
	this.entityVis;
	this.overalyVis;
	this.foregroundVis;
	this.backgroundVis;
	this.collisionVis;
	this.blockSelection;
	// animation variables
	this.animationRequest;
	this.timeOfLastFrame;
	this.deltaTime;
	this.fade = 0;
	this.fadeIn = false;
	this.fadeOut = false;
	// rendering constants
	this.fullscreen = true;
	this.view = {
		width: 16,
		height: 24
	}
	this.viewScale = new Vector()
	// assets
	this.blockSheet = new Image();
	this.overlaySheet = new Image();
	this.undefined = new Image();
	this.blockWidth = 8;
	// slower 1/10 second update
	this.tickCounter = 0;
	this.Tick = function () {
		var self = this;
		// sprite animation
		if (self.mode === 'play') {
			self.levels[self.level].entities.forEach(function (entity) {
				if (entity !== null) {
					if (typeof entity.Animate == 'function') {
						entity.Animate();
					}
					if (entity.AI) {
						entity.AI(self.levels[self.level]);
					}
				}
			});
		}
		if (!self.fullscreen) {
			document.getElementById('mode').innerHTML = self.mode == 'edit' ?  'Play' : 'Edit';
		}
		// info
		self.fps.innerHTML = 'FPS: ' + Math.round(1/self.deltaTime);
	}
	// fast 1/60 second update
	this.Update = function () {
		var self = this;
		// fading
		if (self.fadeIn) {
			self.fade -= 0.005;
			if (self.fade < 0) {
				self.fadeIn = false;
			}
		} else if (self.fadeOut) {
			self.fade += 0.005;
			if (self.fade > 1) {
				self.fadeOut = false;
				self.AdvanceLevel();
			}
		}
		// movement
		switch (self.mode) {
			case 'edit':
				var velocity = self.view.height*0.015;
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
				var player = self.levels[self.level].entities[0];
				self.camera.x = clamp(player.position.x,self.view.width/2-0.5,self.levels[self.level].width-self.view.width/2-0.5);
				self.camera.y = clamp(player.position.y,self.view.height/2-0.5,self.levels[self.level].height-self.view.height/2-0.5);
				// update entities
				self.levels[self.level].entities.forEach(function (entity,index) {
					if (entity !== null && Math.abs(entity.position.x - player.position.x) < 32 && Math.abs(entity.position.y - player.position.y) < 32) {
						entity.Update(self.deltaTime,self.levels[self.level]);
					}
				});
				
				break;
		}
		
	}
	this.Render = function () {
		var self = this;
		// clear the screen
		ctx.fillStyle = 'rgb(192,192,255)';
		ctx.fillRect(0,0,canvas.width,canvas.height);
		// Blocks
		var topLeft = new Vector(self.camera.x - self.view.width/2,self.camera.y - self.view.height/2);
		var x = Math.round(topLeft.x);
		var y = Math.round(topLeft.y);
		for (var yCoord = Math.round((y - topLeft.y) * self.viewScale.y) ; yCoord < canvas.height + self.viewScale.y ; yCoord+= self.viewScale.y) {		
			for (var xCoord = Math.round((x - topLeft.x) * self.viewScale.x); xCoord < canvas.width + self.viewScale.x ; xCoord += self.viewScale.x) {
				var screenX = Math.floor(xCoord-self.viewScale.x/2);
				var screenY = Math.floor(yCoord-self.viewScale.y/2);
				if (x >= 0 && x < self.levels[self.level].width && y >= 0 && y < self.levels[self.level].height) {
					if (self.backgroundVis.checked && self.levels[self.level].GetForeground(x,y)=== 0 && self.levels[self.level].GetBackground(x,y) !== 0) {
						// background
						var parallax = new Vector (x,y);
						var sy = Math.floor(self.levels[self.level].GetBackground(parallax.x,parallax.y) / (self.blockSheet.width/self.blockWidth));
						var sx = self.levels[self.level].GetBackground(parallax.x,parallax.y) - (sy * (self.blockSheet.width/self.blockWidth));
						ctx.drawImage(self.blockSheet, sx * self.blockWidth, sy * self.blockWidth, self.blockWidth, self.blockWidth, screenX,screenY, self.viewScale.x, self.viewScale.y);
						ctx.fillStyle = 'rgba(0,0,0,0.5)';
						ctx.fillRect(screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
					if (self.foregroundVis.checked && self.levels[self.level].GetForeground(x,y) !== 0) {
						// foreground
						var sy = Math.floor(self.levels[self.level].GetForeground(x,y) / (self.blockSheet.width/self.blockWidth));
						var sx = self.levels[self.level].GetForeground(x,y) - (sy * (self.blockSheet.width/self.blockWidth));
						ctx.drawImage(self.blockSheet, sx * self.blockWidth, sy * self.blockWidth, self.blockWidth, self.blockWidth, screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
					if (self.overlayVis.checked && self.levels[self.level].GetOverlay(x,y) !== 0) {
						// overlay
						var sy = Math.floor(self.levels[self.level].GetOverlay(x,y) / (self.blockSheet.width/self.blockWidth));
						var sx = self.levels[self.level].GetOverlay(x,y) - (sy * (self.blockSheet.width/self.blockWidth));
						ctx.drawImage(self.overlaySheet, sx * self.blockWidth, sy * self.blockWidth, self.blockWidth, self.blockWidth, screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
					if (self.collisionVis.checked ) {
						// collision
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
		// Entities
		if (self.entityVis.checked) {
			var player = self.levels[self.level].entities[0];
			self.levels[self.level].entities.forEach(function (entity,index) {
				if (index !== 0 && entity !== null) {
					entity.Render();
				}
			});
			
			player.Render();
		}
		// placement
		switch (self.mode) {
			case 'edit':
				var coord = ScreenToGame(new Vector(input.mouse.xPos,input.mouse.yPos));
				coord.Round();
				if (typeof self.primarySelection === 'number') {
					// place block
					var penSize = parseInt(document.getElementById('penSize').value);
					var area = ellipse(coord.x,coord.y,penSize,penSize);
					switch(document.getElementById('penShape').value) {
						case 'square':
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
						break;
						case 'circle':
						area.forEach(function (vector) {
						if (input.mouse.left) {
								self.PlaceBlock(self.layer,new Vector(vector.x,vector.y),self.primarySelection);
							}
							// block highlight
							var screenCoord = GameToScreen(new Vector(vector.x,vector.y));
							ctx.fillStyle = 'rgba(255,255,255,0.25)';
							ctx.fillRect(Math.floor(screenCoord.x-self.viewScale.x/2), Math.floor(screenCoord.y-self.viewScale.y/2), self.viewScale.x, self.viewScale.y);
						});
						break;
					}
				} else if (typeof self.primarySelection === 'string') {
					// place entity
					if (self.entityGhost.uvSize.x % 2 == 0) {
						coord.x -= 0.5;
					}
					if (self.entityGhost.uvSize.y % 2 == 0) {
						coord.y -= 0.5
					}
					if (input.mouse.left) {
						if (self.entityGhost.type !== 'Remove') {
							var entity = new window[self.primarySelection](coord.x,coord.y);
							switch (self.primarySelection) {
								case 'Player':
								self.levels[self.level].start = coord;
								self.levels[self.level].entities[0] = entity;
								break;
								default: self.levels[self.level].entities.push(entity);
							}
							input.mouse.left = false;
						} else {
							// Remove any entities under the mouse
							self.entityGhost.CheckEntityCollision(self.levels[self.level]);
						}
					}
					// entity ghost
					self.entityGhost.position = self.entityGhost.type === 'Remove' ? ScreenToGame(new Vector(input.mouse.xPos,input.mouse.yPos)) : coord;
					ctx.globalAlpha = 0.5;
					self.entityGhost.Render();
					ctx.globalAlpha = 1;
				}
			break;
		}
		
		// Fade in and out 
		if (self.fade > 0) {
			ctx.fillStyle = 'rgba(0,0,0,' + self.fade + ')';
			ctx.fillRect(0,0,canvas.width,canvas.height);
		}
	}
	this.End = function () {
		var self = this;
		self.pause = true;
		self.fade = 0;
		self.fadeIn = false;
		self.fadeOut = false;
		ctx.font = "100px Arial";
		ctx.textAlign = "center";
		ctx.fillStyle = 'white';
		ctx.fillText('The End',canvas.width/2,canvas.height/2);
	}
	this.FadeOut = function () {
		if (!this.fadeOut) {
			this.fadeIn = false;
			this.fadeOut = true;
			this.fade = 0;
		}
	}
	this.FadeIn = function () {
		if (!this.fadeIn) {
			this.fadeOut = false;
			this.fadeIn = true;
			this.fade = 1;
		}
	}
	this.UpdateLevel = function () {
		var self = this;
		// remove levels from level list
		var levels = document.getElementById('levelSelect');
		while (levels && levels.firstChild) {
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
		return {version: self.version,name:self.name,view:self.view,level:self.level,levels:levels};
	}
	this.Import = function (gameData) {
		var self = this;
		self.mode = 'edit';
		self.name = gameData.name;
		self.version = gameData.version;
		self.view = gameData.view;
		self.UpdateView();
		self.levels = [];
		self.level = gameData.level;
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
		var canvasRect = canvas.getBoundingClientRect();
		var toolBarRect = self.toolBar.getBoundingClientRect();
		self.toolBar.style.height = (window.innerHeight-toolBarRect.top-16).toString() + 'px';	
		canvas.width  = self.fullscreen ? window.innerWidth - 24 : toolBar.getBoundingClientRect().left-16;
		canvas.height = window.innerHeight-canvasRect.top - 16;
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
		if (!self.pause && self.levels[self.level] !== undefined) {
			self.Update();
			if (!self.pause) {
			// tick update
			if (self.tickCounter > 6) {
				self.tickCounter = 0;
			}
			if (self.tickCounter == 0) {
				self.Tick();
			}
			self.tickCounter++;
			self.Render();
			}
		}
		self.animationRequest = window.requestAnimFrame(function () {
			self.Animation();
		});
	}
	this.AdvanceLevel = function () {
		var self = this;
		if (self.level + 1 < self.levels.length) {
			self.level++;
			self.UpdateLevel();
			self.FadeIn();
		} else {
			// the End
			self.End();
			
		}
	}
	this.Stop = function() {
		window.cancelAnimationFrame(this.animationRequest);
	}
	this.Initialize = function () {
		var self = this;
		
		// load assets
		self.blockSheet.src = 'textures/blockSheet.png';
		self.blockSheet.width = 128;
		self.blockSheet.height = 128;
		self.overlaySheet.src = 'textures/overlaySheet.png';
		self.undefined.src = 'textures/undefined.png';
		// HTML
		self.toolBar = document.getElementById('toolBar');
		
		document.getElementById('play').onclick = function () {
			self.pause = false;
			self.fade = 0;
			self.fadeIn = false;
			self.fadeOut = false;
			self.fullscreen = true;
			if (document.getElementById('toolBar')) {
				document.getElementById('body').removeChild(self.toolBar);
			}
			self.UpdateView();
			// Import
			document.getElementById('gameData').remove();
			var gameScript = document.createElement('SCRIPT');
			gameScript.onload = function () {
				self.Import(gameData);
				self.mode = 'play';
			}
			gameScript.id = 'gameData';
			gameScript.type = 'text/javascript';
			gameScript.src = 'levels/Demo.js';
			document.getElementsByTagName('head')[0].appendChild(gameScript);
		}
		document.getElementById('create').onclick = function () {
			self.pause = false;
			self.fade = 0;
			self.fadeIn = false;
			self.fadeOut = false;
			self.fullscreen = false;
			document.getElementById('body').appendChild(self.toolBar);
			self.UpdateView();
			self.levels = [new Level('Level 1',64,64)];
			self.level = 0;
			self.camera = new Vector(self.levels[self.level].entities[0].position.x,self.levels[self.level].entities[0].position.y);
			self.mode = 'edit';
			self.UpdateLevel();
		}
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
			self.entityGhost = new window[self.primarySelection]();
		}
		// Layers
		self.entityVis = document.getElementById('entityVis');
		self.overlayVis = document.getElementById('overlayVis');
		self.foregroundVis = document.getElementById('foregroundVis');
		self.backgroundVis = document.getElementById('backgroundVis');
		self.collisionVis = document.getElementById('collisionVis');
		self.layers.push({button:document.getElementById('entities')});
		self.layers.push({button:document.getElementById('overlay')});
		self.layers.push({button:document.getElementById('foreground')});
		self.layers.push({button:document.getElementById('background')});
		self.layers.push({button:document.getElementById('collision')});
		
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
					if (self.layer === 'overlay') {
						document.getElementById('blockSelection').style.backgroundImage = "url('textures/overlaySheet.png')";
					} else {
						document.getElementById('blockSelection').style.backgroundImage =  "url('textures/blockSheet.png')";
					}
				}
			};
		});
		document.getElementById('foreground').onclick();
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
			self.pause = false;
			self.fade = 0;
			self.fadeIn = false;
			self.fadeOut = false;
			if (self.mode === 'play') {
				self.mode = 'edit';
				self.camera = new Vector(self.camera.x,self.camera.y);
				
			} else if (self.mode === 'edit') {
				self.mode = 'play';
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
				self.mode = 'edit';
				self.level = self.levels.length-1;
				self.camera = new Vector(0,0);
				self.view.height = Math.min(self.view.height,self.levels[self.level].height);
				self.UpdateView();
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
			if (self.mode == 'edit') {
				if (event.wheelDelta > 0) {
					if (input.action.shift) {
						self.view.height = Math.max(self.view.height-1,2);
					} else {
						document.getElementById('penSize').stepUp();
					}
					
				} else {
					if (input.action.shift) {
						self.view.height = Math.min(self.view.height+1,64);
					} else {
						document.getElementById('penSize').stepDown();
					}
					
				}
				self.UpdateView();
			}
		});
		if (self.fullscreen) {
			document.getElementById('body').removeChild(self.toolBar);
		}
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
	
	this.overlay = [];
	this.foreground = [];
	this.background = [];
	this.collision = [];
	
	this.start = new Vector(2,Math.floor(height/2)-1.5);
	var player = new Player();
	player.respawn = this.start;
	player.Respawn();
	this.entities = [player];
	
	this.Reset = function () {
		var self = this;
		self.entities[0].respawn = self.start;
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
		return {name: self.name, width: self.width, height: self.height,overlay: Compress(self.overlay), foreground: Compress(self.foreground), background: Compress(self.background), collision: Compress(self.collision), start: self.start.Export(),entities: entities}
	}
	this.Import = function (data) {
		var self = this;
		// properties
		self.name = data.name;
		self.width = data.width;
		self.height = data.height;
		// map
		self.overlay = UnCompress(data.overlay);
		self.foreground = UnCompress(data.foreground);
		self.background = UnCompress(data.background);
		self.collision = UnCompress(data.collision);
		// entities
		self.start = new Vector();
		self.start.Import(data.start);
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
	this.GetOverlay = function (x,y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return this.overlay[this.GetIndex(x,y)];
		} else {
			return 0;
		}
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
					self.foreground.push(35)
					self.collision.push(1);
				} else if (y > 32){
					self.foreground.push(32)
					self.collision.push(1);
				} else {
					self.foreground.push(0)
					self.collision.push(0);
				}
				self.background.push(0);
				self.overlay.push(0);
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
	// rendering
	this.sheet = sheet;
	this.spriteSheet = new Image();
	this.frame = 0;
	this.state = 0;
	this.uv = new Vector(0,0); // texture coordinates
	this.uvSize = new Vector(2,2); // how many in-game blocks each frame's size is
	this.frameCount = 8;
	// properties
	this.respawn = new Vector(x,y);
	this.maxHealth = 1;
	this.health = this.maxHealth;
	this.dead = false;
	this.mass = 1;
	this.width = width;
	this.height = height;
	this.direction = 1;
	// physics
	this.force = new Vector(0,0);
	this.position = new Vector(x,y);
	this.velocity = new Vector(0,0);
	this.acceleration = new Vector(0,0);
	this.collision = {left:false,right:false,top:false,bottom:false};
	this.Damage = function(ammount) {
		if (this.health > 0) {
			this.health -= ammount;
			if (this.health <= 0) {
				this.Kill();
			}
		}
	}
	this.Kill = function () {
		if (this.state != 3) {
			this.frame = 0;
			this.state = 3;
			this.velocity.x = 0;
		}
	}
	this.Death = function () {
		this.dead = true;
		this.state = 0;
		this.frame = 0;
		this.uv = new Vector(0,0);
		this.velocity = new Vector(0,0);
	}
	this.Respawn = function () {
		this.dead = false;
		this.health = this.maxHealth;
		this.state = 0;
		this.frame = 0;
		this.uv = new Vector(0,0);
		this.velocity = new Vector(0,0);
		this.position.x = this.respawn.x;
		this.position.y = this.respawn.y;
	}
	this.OnCollision = function (entity) {
		
	}
	this.OnImpact = function (block) {
		
	}
	this.Render = function () {
		var self = this;
		if (!self.dead) {
			var screen = GameToScreen(self.position);
			if (screen.x < canvas.width + (self.width*game.blockWidth) && screen.x > -self.width*game.blockWidth && screen.y < canvas.height + (self.height*game.blockWidth) && screen.y > -self.height*game.blockWidth ) {
				ctx.save();
				if (self.direction === -1) {
					var coord = GameToScreen(self.position);
					ctx.translate(coord.x,coord.y);
					ctx.scale(-1,1);
					ctx.translate(-coord.x,-coord.y);
				}
				ctx.drawImage(self.spriteSheet,self.uv.x,self.uv.y,self.uvSize.x*game.blockWidth,self.uvSize.y*game.blockWidth,screen.x-(game.viewScale.x*self.uvSize.x/2),screen.y-(game.viewScale.y*self.uvSize.y/2),self.uvSize.x*game.viewScale.x,self.uvSize.y*game.viewScale.y);
				ctx.restore();
				// health bar
				if (self.health < self.maxHealth) {
					var percent = self.health/self.maxHealth;
					ctx.fillStyle = 'rgb(' + Math.round((1-percent)*255) + ',' + Math.round(percent*255) + ',0)';
					ctx.fillRect(screen.x-(game.viewScale.x*self.uvSize.x/2),screen.y-(game.viewScale.y*self.uvSize.y/2)- game.viewScale.y * 0.25,(self.uvSize.x*game.viewScale.x) * percent, game.viewScale.y * 0.25);
				}
			}
		}
	}
	this.Animate = function () {
		var self = this;
		if (!self.dead) {
			
			// update direction
			if (self.velocity.x < 0) {
				self.direction = -1;
			} else if (self.velocity.x > 0) {
				self.direction = 1;
			}
			if (self.frame < self.frameCount-1) {
				self.frame++;
			} else {
				// dead
				if (self.state === 3) {
					self.Death();
				}
				self.frame = 0;
			}
			self.uv.x = self.frame * self.uvSize.x*game.blockWidth;
			self.uv.y = self.state * self.uvSize.y*game.blockWidth;
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
	this.CheckCollision = function (level) {
		/* var self = this;
		var margin = 0.0625;
		var collisionMax = {left:0,right:0,top:0,bottom:0};
		for (var iY = Math.round(self.position.y - self.height/2); iY <= Math.round(self.position.y + self.height/2); iY++ ){
			for (var iX = Math.round(self.position.x - self.width/2 - 0.5); iX <= Math.round(self.position.x + self.width + 0.5); iX++ ) {
				if (level.GetCollision(iX,iY)) {
					var collision = self.Collision({x:self.position.x-self.width/2-margin,y:self.position.y-self.height/2-margin,width:self.width+2*margin,height:self.height+2*margin},{x:iX-0.5,y:iY-0.5,width:1,height:1});
					if (Math.abs(collision.x) >= Math.abs(collision.y)) {
						// vertical collision
						if (collision.y > collisionMax.bottom) {
							collisionMax.bottom = collision.y;
						} else if (collision.y < collisionMax.top) {
							collisionMax.top = collision.y; 
						}
					} else if (Math.abs(collision.x) < Math.abs(collision.y)) {
						if (collision.x > collisionMax.right) {
							collisionMax.right = collision.x;
						} else if (collision.x < collisionMax.left) {
							collisionMax.left = collision.x;
						}
					}
				}
			}
		}
		if (collisionMax.left == -margin) {
			
		}
		var collisionSum = new Vector(collisionMax.left + collisionMax.right,collisionMax.top + collisionMax.bottom);
		return collisionSum; */
	}
	this.CheckEntityCollision = function (level) {
		var self = this;
		level.entities.forEach(function (entity,index) {
			if (entity !== self && entity !== null && !entity.dead && Math.abs(self.position.x-entity.position.x) < 4 && Math.abs(self.position.y-entity.position.y < 4)) {
				var collision = self.Collision({x:self.position.x-self.width/2,y:self.position.y-self.height/2,width:self.width,height:self.height},
				{x:entity.position.x-entity.width/2,y:entity.position.y-entity.height/2,width:entity.width,height:entity.height});
				if (collision.x != 0 || collision.y != 0) {
					entity.OnCollision(self);
					self.OnCollision(entity,index,level);
				}
			}
		});
	}
	this.Initialize = function () {
		var self = this;
		if (self.sheet !== undefined) {
			self.spriteSheet.src = self.sheet;
			self.spriteSheet.onload = function () {
				self.frameCount = Math.floor(self.spriteSheet.width/(self.uvSize.x*game.blockWidth));
			}
		}
	}
	this.Initialize();
}
Entity.prototype.Update = function (deltaTime,level) {
	var self = this;
	if (!self.dead && self.state !== 3) {
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
		var collisionMax = {left:0,right:0,top:0,bottom:0};
		for (var iY = Math.round(self.position.y - self.height/2); iY <= Math.round(self.position.y + self.height/2); iY++ ){
			for (var iX = Math.round(self.position.x - self.width/2 - 0.5); iX <= Math.round(self.position.x + self.width + 0.5); iX++ ) {
				if (level.GetCollision(iX,iY)) {
					var collision = self.Collision({x:self.position.x-self.width/2,y:self.position.y-self.height/2,width:self.width,height:self.height},{x:iX-0.5,y:iY-0.5,width:1,height:1});
					if (collision.x !== 0 || collision.y !== 0) {
						self.OnImpact();
					}
					if (Math.abs(collision.x) >= Math.abs(collision.y)) {
						// vertical collision
						if (collision.y > collisionMax.bottom) {
							collisionMax.bottom = collision.y;
						} else if (collision.y < collisionMax.top) {
							collisionMax.top = collision.y; 
						}
					} else if (Math.abs(collision.x) < Math.abs(collision.y)) {
						if (collision.x > collisionMax.right) {
							collisionMax.right = collision.x;
						} else if (collision.x < collisionMax.left) {
							collisionMax.left = collision.x;
						}
					}
				}
			}
		}
		var collisionSum = new Vector(collisionMax.left + collisionMax.right,collisionMax.top + collisionMax.bottom);
		// Handle the collisions
		if (collisionSum.y !== 0 && Math.abs(collisionSum.y) >= Math.abs(collisionSum.x)) {
			// vertical collision
			self.position.y -= collisionSum.y;
			self.velocity.y = 0;
			if (collisionSum.y > 0) {
				self.collision.bottom = true;
			} else if (collisionSum.y < 0) {
				self.collision.top = true;
			}
		} else if (collisionSum.x !== 0 && Math.abs(collisionSum.y) < Math.abs(collisionSum.x)) {
			// horizontal collision
			self.position.x -= collisionSum.x;
			self.velocity.x = 0;
			if (collisionSum.x > 0) {
				self.collision.right = true;
			} else if (collisionSum.x < 0) {
				self.collision.left = true;
			}
		}
		// check for entity collision
		self.CheckEntityCollision(level);
	}
}
Entity.prototype.Export = function () {
	var self = this;
	return {type: self.type,sheet: self.sheet,respawn: self.respawn.Export(), maxHealth: self.maxHealth,dead: self.dead,mass: self.mass, width: self.width, height: self.height, direction:self.direction, uvSize: self.uvSize.Export(),force: self.force.Export(),position:self.position.Export(),
	velocity:self.velocity.Export(), acceleration:self.acceleration.Export(),collision:self.collision};
}
Entity.prototype.Import = function (entityData) {
	var self = this;
	self.sheet = entityData.sheet;
	self.respawn = new Vector();
	self.respawn.Import(entityData.respawn);
	self.maxHealth = entityData.maxHealth;
	self.health = entityData.maxHealth;
	self.dead = entityData.dead;
	self.mass = entityData.mass;
	self.width = entityData.width;
	self.height = entityData.height;
	self.direction = entityData.direction;
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
function NPC (x,y,width,height,sheet,speed,jumpHeight) {
	Entity.call(this, x, y,width,height, sheet);
	this.type = 'NPC';
	this.speed = speed;
	this.jumpHeight = jumpHeight;
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
		if (this.collision.bottom && this.jumpHeight) {
			this.velocity.y = -Math.sqrt(2 * this.acceleration.y * this.jumpHeight);
		}
	}
	this.Shoot = function (type,level,target) {
		if (this.lastFire >= this.coolDown) {
			var velocity = 20;
			var bullet = new window[type](this.position.x,this.position.y-0.5);
			bullet.velocity.x = this.direction*velocity;
			if (target instanceof Vector) {
				var angle = Math.atan2(this.position.y-target.y,this.position.x-target.x);
				angle += Math.PI;
				bullet.velocity.x = Math.cos(angle) * velocity;
				bullet.velocity.y = Math.sin(angle) * velocity;
			}
			level.entities.push(bullet);
			this.lastFire = 0;
		}
	}
}
NPC.prototype.Update = function (deltaTime,level) {
	var self = this;
	Entity.prototype.Update.call(this,deltaTime,level);
	// update the sprite state (idle, run, jump, death)
	var lastState = self.state;
	if (self.state != 3) {
		if (Math.abs(self.velocity.x) != 0) {
			self.state = 1; // run
		}  else {
			self.state = 0; // idle
		}
		if (Math.abs(self.velocity.y) != 0) {
			self.state = 2; // jumping / falling
		}
	}
	if (lastState !== self.state) {
		self.frame = 0; // reset frame for new state
	}
	self.lastFire+=deltaTime;
}
NPC.prototype.Export = function () {
	var self = this;
	var obj = Entity.prototype.Export.call(this);
	obj.speed = self.speed;
	obj.jumpHeight = self.jumpHeight;
	return obj;
}
NPC.prototype.Import = function (NPCdata) {
	var self = this;
	Entity.prototype.Import.call(this,NPCdata);
	self.speed = NPCdata.speed;
	self.jumpHeight = NPCdata.jumpHeight;
}
// You
function Player (x,y) {
	// inherits from NPC
	NPC.call(this, x, y,1,2,'textures/Player.png',10,4.5);
	this.type = 'Player';
	this.coolDown = 0.25;
	this.OnCollision = function (entity) {
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
				self.Shoot('PlayerBullet',level);
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
function Hostile (x,y,width,height,sheet,speed,jumpHeight,minRange,maxRange,jump) {
	// inherits from NPC
	NPC.call(this, x, y,width,height,sheet,speed,jumpHeight);
	this.type = 'Hostile';
	this.minRange = minRange;
	this.maxRange = maxRange;
	this.jump = jump;
	this.OnCollision = function (entity) {
		if (this.state !== 3&& entity.type === 'Player') {
			entity.Kill();
		}
	}
	this.CheckGround = function (level) {
		var self = this;
		var y = Math.ceil(self.position.y)+1;
		while (!level.GetCollision(Math.round(self.position.x+self.direction),y)) {
			y++;
		}
		return y - (Math.ceil(self.position.y)+1);
	}
	this.AI = function (level) {
		var self = this;
		if (!self.dead && self.state !== 3) {
			var player = level.entities[0];
			if (player.state !== 3) {
				var distance = player.position.x - self.position.x 
				if (Math.abs(distance) < self.maxRange) {
					if (Math.abs(distance) > self.minRange) {
						// jump
						if (level.GetCollision(Math.round(self.position.x + self.direction),Math.round(self.position.y + 0.5)) != 0) {
							self.CheckJump(level);
						}
						// move
						if ( distance > 0) {
							self.MoveRight();
						} else if (distance < 0) {
							self.MoveLeft();
						}
						// check for cliffs
						if (self.CheckGround(level) > self.jumpHeight){
							self.Stop();	
						}
					} else {
						self.Stop();
					}
					// shoot
					self.Shoot('Bullet',level,self.type == 'Gage' ? player.position : null);
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
			for (var y = Math.floor(self.position.y-0.5); y>Math.floor(self.position.y-0.5-Math.floor(self.jumpHeight)); y--) {
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
	obj.minRange = self.minRange;
	obj.maxRange = self.maxRange;
	obj.jump = self.jump;
	return obj;
}
Hostile.prototype.Import = function (hostileData) {
	var self = this;
	NPC.prototype.Import.call(this,hostileData);
	self.minRange = hostileData.minRange;
	self.maxRange = hostileData.maxRange;
	self.jump = hostileData.jump;
}
function Saw (x,y) {
	var saw = new Hostile(x,y,2,1.5,'textures/Saw.png',5,0,1,16);
	saw.type = 'Saw';
	saw.maxHealth = 2;
	saw.Shoot = function () {}
	/* this.Update = function (deltaTime,level) {
		Hostile.prototype.Update.call(this,deltaTime,level);
	}
	this.Export = function () {
		return Hostile.prototype.Export.call(this);
	}
	this.Import = function (sawData) {
		Hostile.prototype.Import.call(this,sawData);
	} */
	saw.Respawn();
	return saw;
}
function Seeker (x,y) {
	var seeker = new Hostile(x,y,1,2,'textures/Seeker.png',5,3.5,5,16);
	seeker.type = 'Seeker';
	seeker.maxHealth = 3;
	seeker.Respawn();
	return seeker;
}
function Turret (x,y) {
	var turret = new Hostile(x,y,2,2,'textures/Turret.png',0,0,0,24);
	turret.type = "Turret";
	turret.maxHealth = 1;
	turret.Respawn();
	return turret;
}
function Gage (x,y) {
	var gage = new Hostile(x,y,4,5,'textures/Gage.png',3,5.5,0,32);
	gage.type = 'Gage';
	gage.maxHealth = 20
	gage.uvSize = new Vector(4,5);
	gage.Respawn();
	return gage;
}
function Checkpoint (x,y) {
	var checkpoint = new Entity(x,y,2,2,'textures/Checkpoint.png');
	checkpoint.type = 'Checkpoint';
	checkpoint.mass = 0;
	checkpoint.OnCollision = function (entity) {
		if (entity.type === 'Player' && checkpoint.state == 0) {
			entity.respawn = checkpoint.position;
			checkpoint.state = 1;
		}
	}
	checkpoint.Kill = function () {}
	return checkpoint;
}
function Exit (x,y) {
	var exit = new Entity(x,y,2,2,'textures/Exit.png');
	exit.type = 'Exit';
	exit.mass = 0;
	exit.OnCollision = function (entity) {
		if (entity.type === 'Player') {
			entity.Stop();
			game.FadeOut();
		}
	}
	return exit;
}
function Bullet (x,y) {
	var bullet = new Entity(x,y,0.25,0.25,'textures/Bullet.png');
	bullet.type = 'Bullet';
	bullet.uvSize = new Vector(1,1);
	bullet.mass = 0;
	bullet.OnCollision = function (entity) {
		if (bullet.state !== 3 && entity.type === 'Player') {
			entity.Damage(1);
			bullet.Kill();
		}
	}
	bullet.OnImpact = function (block) {
		bullet.Kill();
	}
	return bullet;
}
function PlayerBullet (x,y) {
	var bullet = Bullet(x,y);
	bullet.sheet = 'textures/BlueBullet.png';
	bullet.Initialize();
	bullet.OnCollision = function (entity) {
		if (bullet.state !== 3 && entity instanceof Hostile) {
			entity.Damage(1);
			bullet.Kill();
		}
	}
	return bullet;
}
function Acid (x,y) {
	var acid = new Entity(x,y,1,1,'textures/Acid.png');
	acid.type = 'Acid';
	acid.uvSize = new Vector(1,1);
	acid.mass = 0;
	acid.OnCollision = function (entity) {
		entity.Kill();
	}
	return acid;
}
function Remove (x,y) {
	var remove = new Entity(x,y,1,1,'textures/Remove.png');
	remove.type = 'Remove';
	remove.uvSize = new Vector(1,1);
	remove.mass = 0;
	remove.OnCollision = function (entity,index,level) {
		if (entity.type !== 'Player') {
			level.entities[index] = null;
		}
	}
	return remove;
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
		escape: [27],
		ctrl: [17]
	}
	// interface
	this.action = {
		left: false,
		right: false,
		up: false,
		down: false,
		space: false,
		shift: false,
		escape: false,
		ctrl: false
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
	array.forEach(function (data,index) {
		if (data === lastData) {
			// increment counter
			compressed[compressed.length-1][0]++;
		} else {
			// opt for normal array format where optimal
			if (index !== 0) {
				var size = compressed[compressed.length-1][0];
				if (size < 4) {
					var start = compressed.length-1;
					for (var i = start ; i < start + size; i++) {
							compressed[i] = lastData;

					}
				}
			}
			// set-up new block of data
			compressed.push([1,data]);
		}
		lastData = data;
	});
	return compressed;
}
function UnCompress(array) {
	var original = [];
	array.forEach(function (sub) {
		if (Array.isArray(sub)) {
			for(var i = 0; i < sub [0]; i++) {
				original.push(sub[1]);
			}
		} else {
			original.push(sub);
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
function clamp(val, min,max){
    return Math.max(min, Math.min(max, val))
}
function ellipse(x,y,width,height) {
	var a = width/2;
	var b = height/2;
	var indices = []
	var aSqrd = a*a;
	var bSqrd = b*b;
	for (var iY = Math.round(y - b); iY < y + b ; iY++) {
		for (var iX = Math.round(x - a); iX < x + a ; iX++) {
			if (((((iX - x) * (iX - x)) / aSqrd) + (((iY - y) * (iY - y)) / bSqrd)) <= 1) {
				indices.push({x:iX,y:iY});
			}
		}
	}
	return indices;
}