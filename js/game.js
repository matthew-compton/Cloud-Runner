var width = window.innerWidth;		// Canvas width
var height = window.innerHeight;	// Canvas height
var background = "#d0e7f9"; // Background color

var gLoop;								// Game loop
var c = document.getElementById('c');	// Canvas itself
var ctx = c.getContext('2d'); 			// Two-dimensional graphic context of canvas

// Set canvas size
c.width = width;
c.height = height;

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

// The number of clouds
var cloudNumber = 80;
var clouds = [];
for (var i = 0; i < cloudNumber; i++){
	
		/*
		 * Create new object based on function and assign what it returns to the 'cloud' variable
		 */
		var cloud = new (function(){
			var that = this;	// 'that' will be the context now
			
			// Variables
			that.radius = (Math.random() * 40) + 40;
			that.transparency = (Math.random() / 4) + .4;
			that.xspeed = Math.random() * 5;
			that.yspeed = Math.random() * 5;
			
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
				var py = ~~(height/2);
				var distance =  Math.sqrt( Math.pow((px-that.xpos),2) + Math.pow((py-that.ypos),2) );
				
				var acceptableDistance = 100;
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
				ctx.fillStyle = "rgba(255, 255, 255, " + 0.9 + ")";
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
			that.onCollide = function(){
				// Change color on collision
				that.fillStyle = "rgba(0, 0, 0, " + that.transparency + ")";
			}
			
		})(); // End cloud object assignment
		
	clouds.push(cloud);
}

/*
 * Create new object based on function and assign what it returns to the 'player' variable
 */
var player = new (function(){
    var that = this;	// 'that' will be the context now
    
    // Create new Image and set it's source to the image I upload above
    that.image = new Image();
    that.image.src = "images/cloudly-sprites-min.png";

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
	
	// No need to switch animation frame on each game loop,instead at each switching interval
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
player.setPosition(~~((width-player.width)/2),  ~~((height - player.height)/2));

/*
 * Bind movement to keyboard
 */
var Key = {
	_pressed: {},
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	LEFT_ALT: 65,
	UP_ALT: 87,
	RIGHT_ALT: 68,
	DOWN_ALT: 83,
	isDown: function(keyCode) {
		return this._pressed[keyCode];
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
			cloud.onCollide();
		}
	});
}

/*
 * Loops infinitely for the game
 */
var GameLoop = function(){
	clear();
	
	// Move and draw clouds
	clouds.forEach(function(cloud){
		cloud.update();
		cloud.draw();
	});
	
	// Move and draw player
	player.update();
	player.draw();
	
	// Collision detection
	checkCollision();
	
	// Timer loop
	gLoop = setTimeout(GameLoop, 1000 / 50);
}

// Run the game
GameLoop();
