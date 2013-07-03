/*
 * game.js
 * 
 * Copyright 2013 Ambergleam <ambergleam@gmail.com>
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 * 
 * 
 */
var textTitle = "Cloud Runner";

var width = 800;			// Canvas width
var height = 400;			// Canvas height
var marginLeft = 10;				// Leave space between text and left of canvas
var marginTop = 15;					// Leave space between text and top of canvas
var marginBottom = 10;				// Leave space between text and bottom of canvas
var marginText = 20;				// Leave space between two text blocks
var background = "#d0e7f9"; // Background color

var gLoop;								// Game loop
var c = document.getElementById('canvas');	// Canvas itself
var ctx = c.getContext('2d'); 			// Two-dimensional graphic context of canvas

// Set canvas size
c.width = width;
c.height = height;

// Game state
var STATE = {
  TITLE : 		{value: 0, name: "Title"}, 
  GAMESTART: 	{value: 1, name: "Game Start"},
  GAMEPLAY: 	{value: 2, name: "Game Play"}, 
  GAMEPAUSE : 	{value: 3, name: "Game Pause"},
  GAMEOVER : 	{value: 4, name: "Game Over"}
};
var GAMESTATE = STATE.TITLE;	 // Where the game starts 

// Game difficulty
var CHALLENGE = {
	VERYEASY : 	{lives: 5, clouds: 10, name: "Very Easy", 	modifier: 1		}, 
	EASY : 		{lives: 4, clouds: 20, name: "Easy", 		modifier: 2		}, 
	MEDIUM: 	{lives: 3, clouds: 30, name: "Medium", 		modifier: 4		},
	HARD: 		{lives: 2, clouds: 40, name: "Hard", 		modifier: 8	},
	VERYHARD: 	{lives: 1, clouds: 50, name: "Very Hard", 	modifier: 16	}
};
var difficulty = CHALLENGE.MEDIUM;	 // Starting difficulty 

/*
 * Clear the canvas with the chosen color
 */
var clear = function(){
	ctx.fillStyle = background;		// Set active color (sky blue)
	ctx.beginPath();				// Start drawing
	ctx.rect(0, 0, width, height);	// Draw rectangle from point (0, 0) to (width, height) covering whole canvas
	ctx.closePath();				// End drawing
	ctx.fill();						// Fill rectangle with active color selected before
}

// High score in the current session
var highscore = 0;

// Score in the current game
var score = 0;

// Maximum lives of the player
var maxLives;

// Current lives of the player
var currentLives;

// The background fog
var fogDensity;
var fogs;
var setFog = function() {
	for (var i = 0; i < fogDensity; i++){
		
			/*
			 * Create new object based on function and assign what it returns to the 'fog' variable
			 */
			var fog = new (function(){
				var that = this;	// 'that' will be the context now
				
				// Variables
				that.radius = (Math.random() * 320) + 160;
				that.transparency = (Math.random() / 4) + .1;
				that.xspeed = Math.random()*1;
				that.yspeed = Math.random()*1;
				that.xpos = Math.random() * width;
				that.ypos = Math.random() * height;
				
				// Color
				that.fillStyle = "rgba(255, 255, 255, " + that.transparency + ")";
				
				/*
				 * Sets position
				 */
				that.setPosition = function(x, y){
					that.xpos = x;
					that.ypos = y;
				}
				
				/*
				 * Draws the circles on the canvas
				 */
				that.draw = function(){
					// Draw main body of fog
					ctx.fillStyle = that.fillStyle;	// RGBA color with transparency
					ctx.beginPath();
					ctx.arc(that.xpos, that.ypos, that.radius, 0, Math.PI*2, true); // arc(x, y, radius, startAngle, endAngle, anticlockwise)
					ctx.fill();
					ctx.closePath();
				}
				
				/*
				 * Moves the fog
				 */
				that.move = function(deltaX, deltaY){
					that.setPosition(that.xpos + deltaX, that.ypos + deltaY);
				}
				
				/*
				 * Updates the fog
				 */
				that.update = function(){
					if (that.xpos - that.radius > width) {
						that.xpos = -1 * that.radius;
					}
					if (that.ypos - that.radius > height) {
						that.ypos = -1 * that.radius;
					}
					that.move(that.xspeed, that.yspeed);
				}
				
			})(); // End fog object assignment
			
		fogs.push(fog);
	}
}
setFog();

// The number of clouds
var cloudNumber;
var clouds;
var setClouds = function() {
	for (var i = 0; i < cloudNumber; i++){
		
			/*
			 * Create new object based on function and assign what it returns to the 'cloud' variable
			 */
			var cloud = new (function(){
				var that = this;	// 'that' will be the context now
				
				// Variables
				that.radius = (Math.random() * 40) + 60;
				that.transparency = (Math.random() / 4) + .4;
				
				// Randomize starting speed and direction
				that.xspeed = Math.random() * 1 + 2;
				that.yspeed = Math.random() * 1 + 2;
				var xtemp = Math.random();
				if (xtemp > .5) {
					that.xspeed *= -1;
				}
				var ytemp = Math.random();
				if (ytemp > .5) {
					that.yspeed *= -1;
				}
				
				// Fresh cloud, unharmed
				that.collided = false;
				
				// Fix spawn location of clouds
				do {
					that.xpos;
					// Ensure cloud is within boundaries
					do {
						that.xpos = Math.random() * width;
					} while (that.xpos + that.radius > width || that.xpos - that.radius < 0);
					
					// Ensure cloud is within boundaries
					that.ypos;
					do {
						that.ypos = Math.random() * height;
					} while (that.ypos + that.radius > height || that.ypos - that.radius < 0);
					
					// Check every cloud's distance to the center
					var px = ~~(width/2);
					var py = ~~(marginTop);
					var distance =  Math.sqrt( Math.pow((px-that.xpos),2) + Math.pow((py-that.ypos),2) );
					
					var acceptableDistance = 200;
				} while (distance <= acceptableDistance);
				
				// Color
				that.fillStyle = "rgba(255, 255, 255, " + that.transparency + ")";
				
				/*
				 * Sets position
				 */
				that.setPosition = function(x, y){
					that.xpos = x;
					that.ypos = y;
				}
				
				/*
				 * Draws the circles on the canvas
				 */
				that.draw = function(){
					// Draw main body of cloud
					ctx.fillStyle = that.fillStyle;	// RGBA color with transparency
					ctx.beginPath();
					ctx.arc(that.xpos, that.ypos, that.radius, 0, Math.PI*2, true); // arc(x, y, radius, startAngle, endAngle, anticlockwise)
					ctx.fill();
					ctx.closePath();
					
					// Draw cloud outline
					ctx.beginPath();
					ctx.arc(that.xpos, that.ypos, that.radius, 0, Math.PI*2, true);
					ctx.stroke();
					ctx.closePath();
				}
				
				/*
				 * Moves the clouds
				 */
				that.move = function(deltaX, deltaY){
					that.setPosition(that.xpos + deltaX, that.ypos + deltaY);
				}
				
				/*
				 * Updates the clouds
				 */
				that.update = function(){
					if (that.xpos + that.radius + that.xspeed > width || that.xpos - that.radius + that.xspeed < 0) {
						that.xspeed *= -1;
					}
					if (that.ypos + that.radius + that.yspeed > height || that.ypos - that.radius + that.yspeed < 0) {
						that.yspeed *= -1;
					}
					that.move(that.xspeed, that.yspeed);
				}
				
				/*
				 * Collision consequences
				 */
				that.onCollidePlayer = function(){
					if (that.collided == false) {
						// Change color on collision
						that.fillStyle = "rgba(0, 0, 0, " + that.transparency + ")";
						// Add one to the unique collisions tally
						currentLives--;
						// Set collided to be true as the cloud is harmed
						that.collided = true;
					}
				}
				
			})(); // End cloud object assignment
			
		clouds.push(cloud);
	}
}
setClouds();

/*
 * Create new object based on function and assign what it returns to the 'player' variable
 */
var player = new (function(){
    var that = this;	// 'that' will be the context now
    
    // Create new Image and set it's source to the image I upload above
    that.image = new Image();
    that.image.src = "images/cloudly-sprites-outlined.png";

	// Attributes of a single frame
    that.width = 20;
    that.height = 20;

	// Position of image
    that.xpos = 0;
    that.ypos = 0;

	// Number of frames indexed from zero
	that.frames = 1;
	
	// Start from which frame
	that.actualFrame = 0;
	
	// No need to switch animation frame on each game loop, instead at each switching interval
	that.interval = 0;
	
	// Sets position
    that.setPosition = function(x, y){
		that.xpos = x;
		that.ypos = y;
	}
	
	// Movement
	var movement = 5;	// Move increment or speed
	that.moveLeft = function(){
		if (that.xpos > 0) {
			that.setPosition(that.xpos - movement, that.ypos);
		}
	}
	that.moveRight = function(){
		if (that.xpos + that.width < width) {
			that.setPosition(that.xpos + movement, that.ypos);
		}
	}
	that.moveUp = function(){
		if (that.ypos > 0) {
			that.setPosition(that.xpos, that.ypos - movement);
		}
	}
	that.moveDown = function(){
		if (that.ypos + that.height < height) {
			that.setPosition(that.xpos, that.ypos + movement);
		}
	}
	
	// Draws the image
    that.draw = function(){
        try {
			// Cutting source image and pasting it into destination one
			// drawImage(Image Object, source X, source Y, source Width, source Height, destination X (X position), destination Y (Y position), Destination width, Destination height)
            ctx.drawImage(that.image, 0, that.height * that.actualFrame, that.width, that.height, that.xpos, that.ypos, that.width, that.height);
            // 3rd agument needs to be multiplied by number of frames, so on each loop different frame will be cut from the source image
        } catch (e) {
			// If image is too big and will not load until the drawing of the first frame, Javascript will throw error and stop executing everything.
        }
        // Switch frames at every interval
		if ((that.actualFrame == that.frames && that.interval == 12) || (that.actualFrame != that.frames && that.interval == 96)) {
			if (that.actualFrame == that.frames) {
				that.actualFrame = 0;
			} else {
				that.actualFrame++;
			}
			that.interval = 0;
		}
		that.interval++;
    }
    
    that.update = function() {
		if (Key.isDown(Key.UP) || Key.isDown(Key.UP_ALT)) this.moveUp();
		if (Key.isDown(Key.LEFT) || Key.isDown(Key.LEFT_ALT)) this.moveLeft();
		if (Key.isDown(Key.DOWN) || Key.isDown(Key.DOWN_ALT)) this.moveDown();
		if (Key.isDown(Key.RIGHT) || Key.isDown(Key.RIGHT_ALT)) this.moveRight();
	};
    
})(); // End player object assignment

/*
 * Place character on center of screen
 * '~~' returns nearest lower integer from given float, equivalent of Math.floor()
 */
var resetPlayer = function() {
	player.setPosition(~~((width-player.width)/2),  ~~((marginTop)));
}

/*
 * Create new object based on function and assign what it returns to the 'raincloud' variable
 */
var raincloud = new (function(){
    var that = this;	// 'that' will be the context now
    
    // Create new Image and set it's source to the image I upload above
    that.image = new Image();
    that.image.src = "images/raincloud-sprites.png";

	// Attributes of a single frame
    that.width = 17;
    that.height = 17;

	// Position of image
    that.xpos = 0;
    that.ypos = 0;

	// Number of frames indexed from zero
	that.frames = 1;
	
	// Start from which frame
	that.actualFrame = 0;
	
	// No need to switch animation frame on each game loop, instead at each switching interval
	that.interval = 0;
	
	// Sets position
    that.setPosition = function(x, y){
		that.xpos = x;
		that.ypos = y;
	}
	
	// Movement
	var movement = 2;	// Move increment or speed
	that.moveLeft = function(){
		if (that.xpos > 0) {
			that.setPosition(that.xpos - movement, that.ypos);
		}
	}
	that.moveRight = function(){
		if (that.xpos + that.width < width) {
			that.setPosition(that.xpos + movement, that.ypos);
		}
	}
	that.moveUp = function(){
		if (that.ypos > 0) {
			that.setPosition(that.xpos, that.ypos - movement);
		}
	}
	that.moveDown = function(){
		if (that.ypos + that.height < height) {
			that.setPosition(that.xpos, that.ypos + movement);
		}
	}
	
	// Draws the image
    that.draw = function(){
        try {
			// Cutting source image and pasting it into destination one
			// drawImage(Image Object, source X, source Y, source Width, source Height, destination X (X position), destination Y (Y position), Destination width, Destination height)
            ctx.drawImage(that.image, 0, that.height * that.actualFrame, that.width, that.height, that.xpos, that.ypos, that.width, that.height);
            // 3rd agument needs to be multiplied by number of frames, so on each loop different frame will be cut from the source image
        } catch (e) {
			// If image is too big and will not load until the drawing of the first frame, Javascript will throw error and stop executing everything.
        }
        // Switch frames at every interval
		if ((that.actualFrame == that.frames && that.interval == 12) || (that.actualFrame != that.frames && that.interval == 200)) {
			if (that.actualFrame == that.frames) {
				that.actualFrame = 0;
			} else {
				that.actualFrame++;
			}
			that.interval = 0;
		}
		that.interval++;
    }
    
    /*
     * Raincloud moves towards the player
     */
    that.update = function() {
		if (player.ypos < that.ypos) this.moveUp();
		if (player.xpos < that.xpos) this.moveLeft();
		if (player.ypos > that.ypos) this.moveDown();
		if (player.xpos > that.xpos) this.moveRight();
	};
	
	/*
	 * Collision consequences
	 */
	that.onCollidePlayer = function(){
		// Instant death
		currentLives = 0;
	}
    
})(); // End raincloud object assignment

/*
 * Place raincloud on bottom middle of screen
 */
var resetRaincloud = function() {
	raincloud.setPosition(~~((width-raincloud.width)/2),  ~~((height - raincloud.height - 20)));
}

/*
 * Bind movement to keyboard
 */
var Key = {
	_pressed: {},
	LEFT:		37,
	UP:			38,
	RIGHT:		39,
	DOWN:		40,
	LEFT_ALT:	65,
	UP_ALT:		87,
	RIGHT_ALT:	68,
	DOWN_ALT:	83,
	ENTER:		13,
	SPACE:		32,
	isDown: function(keyCode) {
		return this._pressed[keyCode];
	},
	isPressed: function(keyCode) {
		if (this._pressed[keyCode] == true) {
			delete this._pressed[keyCode];
			return true;
		}
		return false;
	},
	onKeypress: function(event) {
		this._pressed[event.keyCode] = true;
		return true;
	},
	onKeydown: function(event) {
		this._pressed[event.keyCode] = true;
	},
	onKeyup: function(event) {
		delete this._pressed[event.keyCode];
	}
};
// Adds event listeners for keys
window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);
window.addEventListener('keypress', function(event) { Key.onKeypress(event); }, false);

/*
 * Collision detection
 */
var checkCollision = function(){
	clouds.forEach(function(cloud){
		// Check every cloud's distance to the player's center
		var px = (player.xpos + ~~(player.width/2));
		var py = (player.ypos + ~~(player.height/2));
		var distance =  Math.sqrt( Math.pow((px-cloud.xpos),2) + Math.pow((py-cloud.ypos),2) );
		if (distance <= cloud.radius) {
			cloud.onCollidePlayer();
		}
	});
	// Check raincloud's distance to the player's center
	var px1 = (player.xpos + ~~(player.width/2));
	var py1 = (player.ypos + ~~(player.height/2));
	var px2 = (raincloud.xpos + ~~(raincloud.width/2));
	var py2 = (raincloud.ypos + ~~(raincloud.height/2));
	var distance =  Math.sqrt( Math.pow((px1-px2),2) + Math.pow((py1-py2),2) );
	if (distance <= (~~(player.width/2) + ~~(raincloud.width/2))) {
		raincloud.onCollidePlayer();
	}
}

/*
 * Lower the current difficulty
 */
var lowerDifficulty = function() {
	if (difficulty == CHALLENGE.VERYHARD) {
		difficulty = CHALLENGE.HARD;
	} else if (difficulty == CHALLENGE.HARD) {
		difficulty = CHALLENGE.MEDIUM;
	} else if (difficulty == CHALLENGE.MEDIUM) {
		difficulty = CHALLENGE.EASY;
	} else if (difficulty == CHALLENGE.EASY) {
		difficulty = CHALLENGE.VERYEASY;
	}
}

/*
 * Raise the current difficulty
 */
var raiseDifficulty = function() {
	if (difficulty == CHALLENGE.VERYEASY) {
		difficulty = CHALLENGE.EASY;
	} else if (difficulty == CHALLENGE.EASY) {
		difficulty = CHALLENGE.MEDIUM;
	} else if (difficulty == CHALLENGE.MEDIUM) {
		difficulty = CHALLENGE.HARD;
	} else if (difficulty == CHALLENGE.HARD) {
		difficulty = CHALLENGE.VERYHARD;
	}
}

/*
 * Updates the game state based on events
 */
var updateGameState = function(){
	CheckStatus();
	Command();
	Transition();
}

/*
 * Checks for misc. state-based events
 */
var CheckStatus = function(){
	if (GAMESTATE == STATE.TITLE) {
		// TITLE
	} else if (GAMESTATE == STATE.GAMESTART) {
		// GAMESTART
	} else if (GAMESTATE == STATE.GAMEPLAY) {
		// GAMEPLAY
		// Check current game conditions
		if (currentLives <= 0) {
			// Game ends
			GAMESTATE = STATE.GAMEOVER;
		} else {
			// Game continues and score increases
			score += difficulty.modifier;
		}
	} else if (GAMESTATE == STATE.GAMEPAUSE) {
		// GAMEPAUSE
	} else if (GAMESTATE == STATE.GAMEOVER) {
		// GAMEOVER
	}	
}

/*
 * Check for state-based commands
 */
var Command = function(){
	if (GAMESTATE == STATE.TITLE) {
		// TITLE
		// Start game
		if (Key.isPressed(Key.ENTER) || Key.isPressed(Key.UP) || Key.isPressed(Key.UP_ALT)) {
			GAMESTATE = STATE.GAMESTART;
		}
		if (Key.isPressed(Key.LEFT) || Key.isPressed(Key.LEFT_ALT)) {
			lowerDifficulty();
		}
		if (Key.isPressed(Key.RIGHT) || Key.isPressed(Key.RIGHT_ALT)) {
			raiseDifficulty();
		}
	} else if (GAMESTATE == STATE.GAMESTART) {
		// GAMESTART
	} else if (GAMESTATE == STATE.GAMEPLAY) {
		// GAMEPLAY
		// Pause game during gameplay
		if (Key.isPressed(Key.SPACE)) {
			GAMESTATE = STATE.GAMEPAUSE;
		}
	} else if (GAMESTATE == STATE.GAMEPAUSE) {
		// GAMEPAUSE
		// Un-Pause game during gameplay
		if (Key.isPressed(Key.SPACE)) {
			GAMESTATE = STATE.GAMEPLAY;
		}
		// Exit current game
		if (Key.isPressed(Key.ENTER)) {
			GAMESTATE = STATE.TITLE;
		}
	} else if (GAMESTATE == STATE.GAMEOVER) {
		// GAMEOVER
		// Restart game
		if (Key.isPressed(Key.SPACE)) {
			GAMESTATE = STATE.GAMESTART;
		}
		if (Key.isPressed(Key.ENTER)) {
			GAMESTATE = STATE.TITLE;
		}
	}
}

/*
 * Transitions the state to the correct state
 */
var Transition = function(){
	// Timer loop and state transitions
	if (GAMESTATE == STATE.TITLE) {
		// TITLE
		StateTitle();
	} else if (GAMESTATE == STATE.GAMESTART) {
		// GAMESTART
		StateGameStart();
	} else if (GAMESTATE == STATE.GAMEPLAY) {
		// GAMEPLAY
		StateGamePlay();
	} else if (GAMESTATE == STATE.GAMEPAUSE) {
		// GAMEPAUSE
		StateGamePause();
	} else if (GAMESTATE == STATE.GAMEOVER) {
		// GAMEOVER
		StateGameOver();
	}	
}

/*
 * Title screen
 */
var StateTitle = function(){
	StateTitleBackground();
	StateTitleGUI();
	gLoop = setTimeout(GameLoop, 1000 / 100);
}

/*
 * Title screen background
 */
fogDensity = 15;
fogs = [];
setFog();
var StateTitleBackground = function(){
	// Update background fog
	fogs.forEach(function(fog){
		fog.update();
		fog.draw();
	});
}

/*
 * Start of game
 */
var StateGameStart = function(){
	// Change starting variables depending on the difficulty
	maxLives = difficulty.lives;
	cloudNumber = difficulty.clouds;
	// Setup game variables
	score = 0;
	collisions = 0;
	currentLives = maxLives;
	// Background fog
	fogDensity = 10;
	fogs = [];
	setFog();
	// Clouds
	clouds = [];
	setClouds();
	// Setup raincloud
	resetRaincloud();
	// Setup player
	resetPlayer();
	// After setup, send to gameplay
	GAMESTATE = STATE.GAMEPLAY;
	gLoop = setTimeout(GameLoop, 1000 / 100);
}

/*
 * Game being played
 */
var StateGamePlay = function(){
	// Updates the game state
	updateGamePlay();
	// Collision detection
	checkCollision();
	// GUI
	StateGamePlayGUI();
	// Game is playing
	gLoop = setTimeout(GameLoop, 1000 / 100);
}

/*
 * Update game play
 */
var updateGamePlay = function(){
	// Update background fog
	fogs.forEach(function(fog){
		fog.update();
		fog.draw();
	});
	// Move and draw clouds
	clouds.forEach(function(cloud){
		cloud.update();
		cloud.draw();
	});
	// Move and draw raincloud
	raincloud.update();
	raincloud.draw();
	// Move and draw player
	player.update();
	player.draw();
}

/*
 * Paused game
 */
var StateGamePause = function(){
	StateGamePauseGUI();
	gLoop = setTimeout(GameLoop, 1000 / 100);
}

/*
 * Game is over
 */
var StateGameOver = function(){
	if (score > highscore) {
		highscore = score;
	}
	// Update background fog
	fogs.forEach(function(fog){
		fog.draw();
	});
	StateGameOverGUI();
	gLoop = setTimeout(GameLoop, 1000 / 100);
}

/*
 * STATE TITLE GUI
 */
var StateTitleGUI = function(){
	ctx.fillStyle = "Black";
	if (difficulty == CHALLENGE.VERYEASY) {
		ctx.font = "Bold 10pt Arial";
		ctx.fillText("Very Easy", 	width / 2 - 220,	height - marginBottom);
		ctx.font = "10pt Arial";
	} else {
		ctx.fillText("Very Easy", 	width / 2 - 220,	height - marginBottom);
	}
	if (difficulty == CHALLENGE.EASY) {
		ctx.font = "Bold 10pt Arial";
		ctx.fillText("Easy",		width / 2 - 100, 	height - marginBottom);
		ctx.font = "10pt Arial";
	} else {
		ctx.fillText("Easy",		width / 2 - 100, 	height - marginBottom);
	}
	if (difficulty == CHALLENGE.MEDIUM) {
		ctx.font = "Bold 10pt Arial";
		ctx.fillText("Medium",		width / 2 - 20,		height - marginBottom);
		ctx.font = "10pt Arial";
	} else {
		ctx.fillText("Medium",		width / 2 - 20,		height - marginBottom);
	}
	if (difficulty == CHALLENGE.HARD) {
		ctx.font = "Bold 10pt Arial";
		ctx.fillText("Hard",		width / 2 + 70, 	height - marginBottom);
		ctx.font = "10pt Arial";
	} else {
		ctx.fillText("Hard",		width / 2 + 70, 	height - marginBottom);
	}
	if (difficulty == CHALLENGE.VERYHARD) {
		ctx.font = "Bold 10pt Arial";
		ctx.fillText("Very Hard",	width / 2 + 160, 	height - marginBottom);
		ctx.font = "10pt Arial";
	} else {
		ctx.fillText("Very Hard",	width / 2 + 160, 	height - marginBottom);
	}
	
	ctx.fillText("Choose Difficulty", width-120, height-30); // Add text in the bottom-right corner of the canvas
	ctx.fillText("ENTER to Start", width-120, height-marginBottom); 	// Add text in the bottom-right corner of the canvas
	GUI_HighScore();
	GUI_Mark();
}

/*
 * STATE GAMESTART GUI
 */
var StateGameStartGUI = function(){
	// None yet
}

/*
 * STATE GAMEPLAY GUI
 */
var StateGamePlayGUI = function(){
	ctx.fillStyle = "Black";
	ctx.font = "10pt Arial";
	ctx.fillText("SPACE to Pause", width-150, height-marginBottom); 	// Add text in the bottom-right corner of the canvas
	GUI_Lives();
	GUI_Stats();
	GUI_Mark();
}

/*
 * STATE GAMEPAUSE GUI
 */
var StateGamePauseGUI = function(){
	// Draw the paused game world
	drawGamePause();
	// Overtext for pausing
	ctx.fillStyle = "Black";
	ctx.font = "20pt Arial";
	ctx.fillText("PAUSED", width / 2 - 60, height / 2 - 40);
	ctx.fillStyle = "Black";
	ctx.font = "10pt Arial";
	ctx.fillText("SPACE to Unpause", width-150, height-marginBottom); 	// Add text in the bottom-right corner of the canvas
	ctx.fillText("ENTER to Main Menu", width-150, height-30); 	// Add text in the bottom-right corner of the canvas
	// Other GUI features
	GUI_Lives();
	GUI_Stats();
	GUI_Mark();
}

/*
 * Draw game during pause
 */
var drawGamePause = function(){
	// Update background fog
	fogs.forEach(function(fog){
		fog.draw();
	});
	// Move and draw clouds
	clouds.forEach(function(cloud){
		cloud.draw();
	});
	// Move and draw raincloud
	raincloud.draw();
	// Move and draw player
	player.draw();
}

/*
 * STATE GAMEOVER GUI
 */
var StateGameOverGUI = function(){
	ctx.fillStyle = "Black";
	ctx.font = "20pt Arial";
	ctx.fillText("GAME OVER", width / 2 - 100, height / 2 - 40);
	ctx.font = "10pt Arial";
	ctx.fillText("SPACE to Restart", width-150, height-marginBottom); 	// Add text in the bottom-right corner of the canvas
	ctx.fillText("ENTER to Main Menu", width-150, height-30); 	// Add text in the bottom-right corner of the canvas
	GUI_Lives();
	GUI_Stats();
	GUI_Mark();
}

/*
 * GUI - Score and collisions remaining
 */
var GUI_Lives = function(){
	var image = new Image();
    image.src = "images/heart-sprites.png";
	for (var i = 0; i < maxLives; i++) {
		try {
			var dim = 11;	// Dimensions of the image
			// drawImage(Image Object, source X, source Y, source Width, source Height, destination X (X position), destination Y (Y position), Destination width, Destination height)
			if (i < currentLives) {
				ctx.drawImage(image, 0, dim * 0, dim, dim, width - (i+1)*marginText, 5, dim, dim);
			} else {
				ctx.drawImage(image, 0, dim * 1, dim, dim, width - (i+1)*marginText, 5, dim, dim);
			}
        } catch (e) {
			// If image is too big and will not load until the drawing of the first frame, Javascript will throw error and stop executing everything.
        }
	}
}

/*
 * GUI - Place Title and Difficulty in top-left
 */
var GUI_Mark = function(){
	ctx.fillStyle = "Black";
	ctx.font = "Bold 10pt Arial";
	ctx.fillText(textTitle, marginLeft, marginTop); 	// Add text in the top-left
	ctx.font = "10pt Arial";
	ctx.fillText(difficulty.name, marginLeft, marginTop + marginText); 
}

/*
 * GUI - Places both scores in bottom-left
 */
var GUI_Stats = function(){
	ctx.fillStyle = "Black";
	ctx.font = "10pt Arial";
	ctx.fillText("Score: " + score, marginLeft, height-30); 	// Add text in the bottom-left corner of the canvas
	ctx.fillText("Record: " + highscore, marginLeft, height-marginBottom); // Add text in the bottom-left corner of the canvas
}

/*
 * GUI - Place high score in bottom-left
 */
var GUI_HighScore = function(){
	ctx.fillStyle = "Black";
	ctx.font = "10pt Arial";
	ctx.fillText("Record: " + highscore, marginLeft, height-marginBottom); // Add text in the bottom-left corner of the canvas
}

/*
 * Loops infinitely for the game
 */
var GameLoop = function(){
	clear();
	// Update game state
	updateGameState();
}

// Run the game
GameLoop();
