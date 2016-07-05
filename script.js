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
	this.levels = [new Level(64,64)];
	this.camera = new Vector(5,32);
	this.mode = 'edit';
	this.lastShift = false;
	this.primarySelection = null;
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
	this.playerSheet = new Image();
	this.blockSheet = new Image();
	this.blockWidth = 8;
	// slower 1/10 second update
	this.tickCounter = 0;
	this.Tick = function () {
		var self = this;
		// inactive tab
		var hidden;
		if (typeof document.hidden !== "undefined"
		|| typeof document.mozHidden !== "undefined"
		|| typeof document.msHidden !== "undefined"
		|| typeof document.webkitHidden !== "undefined") {
		  hidden = true;
		}
		if (hidden) {
			self.Stop();
		}
		// sprite animation
		self.levels[self.level].entities.forEach(function (entity) {
			if (entity.Animate) {
				entity.Animate();
			}
			if (entity.AI) {
				entity.AI(self.levels[self.level]);
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
				self.camera = self.levels[self.level].player.position;
				// update entities
				self.levels[self.level].entities.forEach(function (entity) {
					entity.Update(self.deltaTime,self.levels[self.level]);
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
		if (input.action.shift && !self.lastShift) {
			document.getElementById('mode').onclick();
			self.lastShift = true;
		} else if (!input.action.shift) {
			self.lastShift = false;
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
		for (var yCoord = Math.round((Math.round(topLeft.y) - topLeft.y) * self.viewScale.y) ; yCoord < canvas.height + self.viewScale.y ; yCoord+= self.viewScale.y) {		
			for (var xCoord = Math.round((Math.round(topLeft.x) - topLeft.x) * self.viewScale.x); xCoord < canvas.width + self.viewScale.x ; xCoord += self.viewScale.x) {
				if (x >= 0 && x < self.levels[self.level].width && y >= 0 && y < self.levels[self.level].height) {
					var screenX = Math.floor(xCoord-self.viewScale.x/2);
					var screenY = Math.floor(yCoord-self.viewScale.y/2);
					if (document.getElementById('background').checked && self.levels[self.level].GetForeground(x,y)=== 0 && self.levels[self.level].GetBackground(x,y) !== 0) {
						// background
						var sy = Math.floor(self.levels[self.level].GetBackground(x,y) / (self.blockSheet.width/self.blockWidth));
						var sx = self.levels[self.level].GetBackground(x,y) - (sy * (self.blockSheet.width/self.blockWidth));
						ctx.drawImage(self.blockSheet, sx * self.blockWidth, sy * self.blockWidth, self.blockWidth, self.blockWidth, screenX,screenY, self.viewScale.x, self.viewScale.y);
						ctx.fillStyle = 'rgba(0,0,0,0.5)';
						ctx.fillRect(screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
					if (document.getElementById('foreground').checked && self.levels[self.level].GetForeground(x,y) !== 0) {
						// foreground
						var sy = Math.floor(self.levels[self.level].GetForeground(x,y) / (self.blockSheet.width/self.blockWidth));
						var sx = self.levels[self.level].GetForeground(x,y) - (sy * (self.blockSheet.width/self.blockWidth));
						ctx.drawImage(self.blockSheet, sx * self.blockWidth, sy * self.blockWidth, self.blockWidth, self.blockWidth, screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
					// collision
					if (document.getElementById('collision').checked ) {
						switch (self.levels[self.level].GetCollision(x,y)) {
							case 0: ctx.fillStyle = 'rgba(0,0,255,0.5)'; break;
							case 1: ctx.fillStyle = 'rgba(255,0,0,0.5)'; break;
						}
						ctx.fillRect(screenX,screenY, self.viewScale.x, self.viewScale.y);
					}
				}
				x++;
			}
			x = Math.round(topLeft.x);
			y++;
		}
		// block highlight
		switch (self.mode) {
			case 'edit':
				var coord = ScreenToGame(new Vector(input.mouse.xPos,input.mouse.yPos));
				coord.Add(new Vector(-0.5,0));
				coord.Round();
				if (input.mouse.left) {
					self.PlaceBlock(document.getElementById('workingLayer').value,coord,self.primarySelection);
				}
				coord = GameToScreen(coord);
				ctx.fillStyle = 'rgba(255,255,255,0.25)';
				ctx.fillRect(Math.floor(coord.x-self.viewScale.x/2), Math.floor(coord.y-self.viewScale.y/2), self.viewScale.x, self.viewScale.y);
			break;
		}
		// entities
		self.levels[self.level].entities.forEach( function (entity) {
			entity.Render();
		})
		
		
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
		self.name = gameData.name;
		self.levels = [];
		gameData.levels.forEach(function (levelData) {
			var level = new Level();
			level.Import(levelData);
			self.levels.push(level);
		});
	}
	this.PlaceBlock = function (layer,coord,data) {
		var self = this;
		if (coord.x >= 0 && coord.x < self.levels[self.level].width && coord.y >= 0 && coord.y < self.levels[self.level].height ) {
			if (layer == 'foreground') {
				self.levels[self.level].SetForeground(coord.x,coord.y,data);
				self.levels[self.level].SetCollision(coord.x,coord.y,data > 0 ? 1:0);
			} else if (layer == 'background') {
				self.levels[self.level].SetBackground(coord.x,coord.y,data);
			} else {
				self.levels[self.level].SetCollision(coord.x,coord.y,data > 0 ? 1:0);
			}
		}
	}
	this.UpdateView = function () {
		var self = this;
		// fit the canvas to the screen size
		var rect = canvas.getBoundingClientRect();
		canvas.width  = window.innerWidth-16;
		canvas.height = window.innerHeight-rect.top-8;
		// image interpolation off for IE, Chrome, Firefox
		ctx.msImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		// update game variables
		self.view.width = Math.ceil(self.view.height * (canvas.width/canvas.height));
		self.viewScale.y = Math.ceil(canvas.height/self.view.height);
		self.viewScale.x = self.viewScale.y;
	}
	this.Animation = function () {
		var self = this;
		self.deltaTime = (Date.now() - self.timeOfLastFrame)/1000;
		self.timeOfLastFrame = Date.now();
		self.Update();
		self.Render();
		self.animationRequest = window.requestAnimFrame(function () {
			self.Animation();
		});
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
		self.playerSheet.src = 'textures/playerSheet.png';
		var player = new Player(5,30.5,'textures/playerSheet.png');
		player.Initialize(self.playerSheet);
				player.speed = 10;
				self.levels[self.level].entities.push(player);
				self.levels[self.level].player = player;
				self.levels[self.level].entities.push(new Hostile(32,30.5,'textures/playerSheet.png'));
				self.levels[self.level].entities[1].Initialize(self.playerSheet);
		// HTML
		self.fps = document.getElementById('fps');
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
		// Export
		var button = document.getElementById('export')
		button.onclick = function () {
			var json = JSON.stringify(self.Export());
			var blob = new Blob([json], {type: "application/json"});
			var url  = URL.createObjectURL(blob);
			button.download = self.name + ".json";
			button.href = url;
		}
		// Import
		document.getElementById('import').onclick = function () {
			//loadJSON(function (data) {
				self.Import(JSONdata);
			//});
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
				modeButton.innerHTML = 'Edit';
			}
		}
		// begin animation loop
		self.UpdateView();
		self.timeOfLastFrame = Date.now();
		self.Animation();
	}
}
function Level (width, height) {
	this.name = 'level0';
	this.width = width;
	this.height = height;
	
	this.foreground = [];
	this.background = [];
	this.collision = [];
	
	this.player;
	this.entities = [];
	
	this.Export = function () {
		var self = this;
		var entities = [];
		self.entities.forEach(function (entity) {
			entities.push(entity.Export());
		})
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
		data.entities.forEach(function (entityData) {
			var entity;
			switch (entityData.type) {
				case 'Entity': entity = new Entity(); break;
				case 'NPC': entity = new NPC(); break;
				case 'Player': entity = new Player(); break;
				case 'Hostile': entity = new Hostile(); break;
			}
			entity.Import(entityData);
			var spriteSheet = new Image();
			spriteSheet.src = entity.sheet;
			entity.Initialize(spriteSheet);
			self.entities.push(entity);
			if (entityData.type === 'Player') {
				self.player = entity;
			}
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
	this.SetForeground = function (x,y,data) {
		if (typeof data === 'number' && x >= 0 && x < this.width && y >= 0 && y < this.height) {
			this.foreground[this.GetIndex(x,y)] = data;
		}
	}
	this.GetBackground = function (x,y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return this.background[this.GetIndex(x,y)];
		} else {
			return 0;
		}
	}
	this.SetBackground = function (x,y,data) {
		if (typeof data === 'number' && x >= 0 && x < this.width && y >= 0 && y < this.height) {
			this.background[this.GetIndex(x,y)] = data;
		}
	}
	this.GetCollision = function (x,y) {
		if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
			return this.collision[this.GetIndex(x,y)];
		} else {
			return 1;
		}
	}
	this.SetCollision = function (x,y,data) {
		if (typeof data === 'number' && x >= 0 && x < this.width && y >= 0 && y < this.height) {
			this.collision[this.GetIndex(x,y)] = data;
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
function Entity (x,y,sheet) {
	this.type = 'Entity';
	this.sheet = sheet;
	this.spriteSheet;
	this.mass = 1;
	this.width = 1;
	this.height = 2;
	this.direction = 1;
	this.uv = new Vector(0,0);
	this.force = new Vector(0,0);
	this.position = new Vector(x,y);
	this.velocity = new Vector(1,0);
	this.acceleration = new Vector(0,0);
	this.collision = {left:false,right:false,top:false,bottom:false};
	this.Render = function () {
		var self = this;
		var screen = GameToScreen(self.position);
		ctx.save();
		if (self.direction === -1) {
			var coord = GameToScreen(self.position);
			ctx.translate(coord.x,coord.y);
			ctx.scale(-1,1);
			ctx.translate(-coord.x,-coord.y);
		}
		ctx.drawImage(self.spriteSheet,self.uv.x,self.uv.y,2*game.blockWidth,2*game.blockWidth,screen.x-game.viewScale.x,screen.y-game.viewScale.y,2*game.viewScale.x,2*game.viewScale.y);
		ctx.restore();
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
	this.Initialize = function (spriteSheet) {
		this.spriteSheet = spriteSheet;
	}
}
Entity.prototype.Update = function (deltaTime,level) {
	var self = this;
	// impulses
	self.force.y += self.mass * 32;
	self.acceleration.x = self.force.x / self.mass;
	self.acceleration.y = self.force.y / self.mass;
	self.force.x = 0;
	self.force.y = 0;
	// update velocity
	self.velocity.x += self.acceleration.x * deltaTime;
	self.velocity.y += self.acceleration.y * deltaTime;
	// update position
	self.position.Add(self.velocity.Scalar(deltaTime));
	// check for collision// find all possible block collision boxes
	self.collision = {left:false,right:false,top:false,bottom:false};
	for (var iY = Math.round(self.position.y - 1.5); iY <= Math.round(self.position.y + 1.5); iY++ ){
		for (var iX = Math.round(self.position.x - 0.5); iX <= Math.round(self.position.x + 0.5); iX++ ) {
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
						
						collision = self.Collision({x:self.position.x,y:self.position.y,width:self.width,height:self.height},{x:iX,y:iY,width:1,height:1});
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
}
Entity.prototype.Export = function () {
	var self = this;
	return {type: self.type,sheet: self.sheet, mass: self.mass, width: self.width, height: self.height, direction:self.direction, uv: self.uv.Export(), force: self.force.Export(),position:self.position.Export(),
	velocity:self.velocity.Export(), acceleration:self.acceleration.Export(),collision:self.collision};
}
Entity.prototype.Import = function (entityData) {
	var self = this;
	self.sheet = entityData.sheet;
	self.mass = entityData.mass;
	self.width = entityData.width;
	self.height = entityData.height;
	self.direction = entityData.direction;
	self.uv = new Vector();
	self.uv.Import(entityData.uv);
	self.force = new Vector();
	self.force.Import(entityData.force);
	self.position = new Vector();
	self.position.Import(entityData.position);
	self.velocity = new Vector();
	self.velocity.Import(entityData.velocity);
	self.acceleration = new Vector();
	self.acceleration.Import(entityData.acceleration);
	self.collision = entityData.collision;
}
// All things that are alive
function NPC (x,y,sheet) {
	Entity.call(this, x, y, sheet);
	this.state = 0;
	this.frame = 0;
	this.speed = 5;
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
	this.Death = function () {
		this.frame = 0;
		this.state = 3;
		this.Stop();
	}
	this.Animate = function () {
		var self = this;
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
			self.frame = 0;
			// respawn
			if (self.state === 3) {
				self.position = new Vector(5,31);
				self.state = 0;
			}
		}
		self.uv.x = self.frame * 16;
		self.uv.y = self.state * 16;
	}
}
NPC.prototype.Update = function (deltaTime,level) {
	var self = this;
	Entity.prototype.Update.call(this,deltaTime,level);
}
NPC.prototype.Export = function () {
	var self = this;
	var obj = Entity.prototype.Export.call(this);
	obj.type = 'NPC';
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
function Player (x,y,sheet) {
	// inherits from NPC
	NPC.call(this, x, y,sheet);
}
Player.prototype.Update = function (deltaTime,level) {
	var self = this;
	var velocity = 5;
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
	}
	NPC.prototype.Update.call(this,deltaTime,level)
}
Player.prototype.Export = function () {
	var self = this;
	var obj = NPC.prototype.Export.call(this);
	obj.type = 'Player';
	return obj;
}
Player.prototype.Import = function (playerData) {
	NPC.prototype.Import.call(this,playerData);
}
// Bad guys
function Hostile (x,y,sheet) {
	// inherits from NPC
	NPC.call(this, x, y,sheet);
	this.range = 16;
	this.AI = function (level) {
		var self = this;
		if (level.player.state !== 3) {
			var distance = level.player.position.x - self.position.x 
			if (Math.abs(distance) > 1 && Math.abs(distance) < self.range) {
				if (Math.abs(self.velocity.x) < 0.5) {
					self.CheckJump(level);
				}
				if ( distance > 0) {
					self.MoveRight();
				} else if (distance < 0) {
					self.MoveLeft();
				} else {
					self.Stop();
				}
				
			} else {
				self.Stop();
				var collision = collision = self.Collision({x:self.position.x-self.width/2,y:self.position.y-self.height/2,width:self.width,height:self.height},
				{x:level.player.position.x-level.player.width/2,y:level.player.position.y-level.player.height/2,width:level.player.width,height:level.player.height});
				if (collision.x != 0 || collision.y != 0) {
					level.player.Death();
				}
			}
		} else {
			self.Stop();
		}
	}
	this.CheckJump = function (level) {
		var self = this;
		for (var y = Math.round(self.position.y-0.5); y>Math.round(self.position.y-0.5)-4; y--) {
			if (!level.GetCollision(Math.round(self.position.x+self.direction),y)&&!level.GetCollision(Math.round(self.position.x+self.direction),y-1)) {
				self.Jump();
			}
		}
	}
}
Hostile.prototype.Update = function (deltaTime,level) {
	var self = this;
	var velocity = 5;
	NPC.prototype.Update.call(this,deltaTime,level)
}
Hostile.prototype.Export = function () {
	var self = this;
	var obj = NPC.prototype.Export.call(this);
	obj.type = 'Hostile';
	return obj;
}
Hostile.prototype.Import = function (hostileData) {
	NPC.prototype.Import.call(this,hostileData);
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
	}
	// interface
	this.action = {
		left: false,
		right: false,
		up: false,
		down: false,
		space: false,
		shift: false,
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
	this.Initialize = function (canvas) {
		var self = this;
		// set all keys to false
		for (var i = 0; i < 222; i++) {
			this.keyMap.push(false);
		}
		// add key listeners
		window.addEventListener('keydown', function (event) {
			event.preventDefault();
			self.keyMap[event.keyCode] = true;
			self.UpdateAction();
		});
		window.addEventListener('keyup', function (event) {
			event.preventDefault();
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
		canvas.addEventListener('mousewheel', function (event) {
			
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