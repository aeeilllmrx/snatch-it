//establish the websocket connection with the server
var socket = io();

var tileset = [];//global reference - for server data...
var players = [];//global reference - for server data...

var ClientPlayerIndex = undefined;

//initialise the Canvas



socket.emit('player joining game', 0);


socket.on('player color choices', function(colorSetObjStr){
    snDraw.initialiseCanvas();
    //probably need to decode colorSet here... ToDO - wtf does this comment mean?
    snDraw.Game.Splash.identityPrompt(colorSetObjStr);
});



///upon arrival, process the transmitted game state from the server
socket.on('full game state transmission', function(gameState){

    /*
      there is a design decision to be made whether a full game state transmission
      is always crudely used when a snatch occurs etc, or whether to send a more specific
      update message to clients instead. The latter seems more efficient but more work.
      
      For now, receipt of the first ever game state message (compared with others) is detected
      by looking at the global tileset, which is initially [].
    */

    if(tileset.length<1){//RECIEVE THE MESSAGE FOR THE FIRST time - in this case need to add the listeners...

	canvas.on('mouse:down', function(e){snDraw.Game.Mouse.mDown(e); });
	canvas.on('mouse:up',   function(e){snDraw.Game.Mouse.mUp(e);   });
	canvas.on('mouse:over', function(e){snDraw.Game.Mouse.mOver(e); });
	canvas.on('mouse:out',  function(e){snDraw.Game.Mouse.mOut(e);  });

    }

    var GameStateObject = JSON.parse(gameState);
    tileset = GameStateObject.tileSet;
    players = GameStateObject.playerSet;

    //draws the entire game state on the canvas from the data supplied
    snDraw.Game.initialDrawEntireGame();


});//end of function to load game data



///upon server assertion that a letter is turned over
socket.on('tile turn assert', function(tileDetailsObjStr){
    var detailsObj = JSON.parse(tileDetailsObjStr);
    var flipping_player_i = detailsObj.playerIndex;
    var tile_id = detailsObj.tileID;

    snDraw.Game.animateTileFlip(flipping_player_i, tile_id);
});

socket.on('player wants reset', function(playerName){
    var resetAssent = confirm(playerName + " has requested to reset the game. Do you want to reset the game?");
    socket.emit('agree to reset', resetAssent);	
});


//this is message to Tell me that Alex has said "Reset" - inform of another players decision
socket.on('player response to reset request', function(responseObj){
    //it would be too much to generate a prompt for each, but a toast would be good
    var abcd = JSON.parse(responseObj);
    a = abcd.playerName;
    b = abcd.response;
    
});

socket.on('give client their player index', function(myIndex){
    ClientPlayerIndex = myIndex;
    
});


socket.on('player has joined game', function(playerObjStr){
    //var newPlayer = JSON.parse(playerObjStr);
    //players.push(newPlayer);
    //won't necessarily need to redraw screen here, since player hasn't necessarily got words
});


function PLAYER_SUBMITS_WORD(p){socket.emit('player submits word', p);}
function RESET_REQUEST()       {socket.emit('reset request', 0);}


///Todo what uses this function? Can it be placed elsewhere in the code?
Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};
