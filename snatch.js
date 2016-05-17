var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/snatch_files/snatch.html');
});

app.get('/hardreset', function(req, res){
    myGame = snatchSvr_factory(qty_tiles);//create a snatch game instance with 50 tiles...
    X = new Date();
    Y = "<br/><br/> <a href=\"/\">Play SNATCH-IT</a>";
    res.send('Hard reset of the SNATCH server at ' + X + Y);
});






app.use(express.static('public'));

var qty_tiles = 100;
var snatchSvr_factory = require('./snatch-server.js');
var myGame = snatchSvr_factory(qty_tiles);//create a snatch game instance with 50 tiles...

var SNATCH_GAMES = [];//a dictionary for game objects...

var SDC_factory = require('./scrape_definition_client.js');
var my_SDC = SDC_factory();
    
var prev_result = undefined;
var prev_word = undefined;
my_SDC.rEvent.on('searchComplete', function(result){
    prev_result = result;

});

app.get('/definition/*', function(req, res){
    var frags = req.url.split('/');
    var word = frags[frags.length-1];
    my_SDC.lookup_definition(word);
    res.send('You have just looked up: ' + word + '. <br> Previously, you\
 looked up ' + prev_word + ' and a search result was:<br>' + prev_result);
    prev_word = word;
});

///This is an incomplete fragment...
app.get('/join/*', function(req, res){
    var frags = req.url.split('/');
    var tag = frags[frags.length-1];
});


io.on('connection', function(socket){

    //basic logging
    console.log('a user connected, with ID: '+socket.id);

    socket.on('disconnect', function(){
	var dis_pl_i = myGame.playerIndexFromSocket(socket.id);
	//does a player with this socket ID still exist in the server's list anyway?

	if(dis_pl_i !== undefined){
	    socket.broadcast.emit('player disconnected',dis_pl_i);
	    var dis_pl_name = myGame.getPlayerObject(socket.id).name;
	    myGame.removePlayer(socket.id);
	    console.log('Player ' + dis_pl_i + ' (' + dis_pl_name + ') disconnected (socket.id = ' + socket.id + ')');
	}else{
	    console.log('Connection closed (socket.id = ' + socket.id + ') - no player associated...');
	}
    });

    var rooms = {};
    socket.on('request to init room', function (data){

	//create a new room tag (no one added to room yet)

	var code = randomIndex = Math.floor(Math.random() * 1000);//from 0 to 999
	var c1 = randomIndex = Math.floor(Math.random() * 5);//from 0 to 4

	function pad(num, size) {
	    var s = "000000000" + num;
	    return s.substr(s.length-size);
	}
	var pcode = pad(code,3);

	var v_words = ["purple","orange","green","golden","black"];
	var my_tag = v_words[c1] + " " + pcode; 


    	socket.emit('your room tag', my_tag);
    });

    socket.on('request rooms list', function (data){
	//prepare list of rooms for sending...
    	socket.emit('rooms list', [0,0]);
    });



    socket.on('join room and start', function (choice){
	//respond by providing a set of colours to choose between
	console.log("'client page load' message sent by client");

	var gameObj = myGame.getGameObject();	
	var colorChoices = myGame.provideColorChoice(socket.id)
	var msg_obj = {color_choice: colorChoices,
		       players_t: gameObj.playerSet	    
		      };

	//this data structure needs to be generated by the myGame object...
	socket.emit('player color choices', msg_obj);
    });



    //client provides player details, which is also a request for the full game state
    socket.on('player joined with details', function (details_obj){
	//this newly joined player can be added to the game...
	console.log('player joined with details : ' + JSON.stringify(details_obj));
	myGame.addPlayer(details_obj, socket.id);

	//index to the new joiner
	var pl_i = myGame.playerIndexFromSocket(socket.id);
	socket.emit('give client their player index', pl_i);

	//gamestate to the new joiner
	var gameObj = myGame.getGameObject();
	socket.emit('full game state transmission', gameObj);//now just transmit to the new player
	
	//new joiner to the rest of the players
	var rPID = details_obj.reclaiming_player_index;
	if(rPID !== undefined){
	    var player_join_details = {rejoin_PID: rPID};
	}else{
	    var player_join_details = {player_object: myGame.getPlayerObject(socket.id), rejoin_PID: undefined};
	}
	socket.broadcast.emit('player has joined game', player_join_details);
    });

    socket.on('reset request', function (blank_msg){
	var all_one_agree = myGame.playerAgreesToReset(socket.id);//the return value indicates whether all players agree to the reset
	if (all_one_agree){
	    myGame.resetGame(qty_tiles);
	    //now sent out the new game object:
	    var gameObj = myGame.getGameObject();
	    io.emit('full game state transmission', gameObj);
	}
	else{//in the case where there are other players...
	    var pl_i = myGame.playerIndexFromSocket(socket.id);
	    socket.broadcast.emit('player wants reset', pl_i);
	}
    });



    //client requests to turn over a tile
    socket.on('agree to reset', function(agrees){
	var pl_i = myGame.playerIndexFromSocket(socket.id);
	socket.broadcast.emit('player response to reset request', {player_index: pl_i, response: agrees});
	if(agrees){
	    var reset_agreement = myGame.playerAgreesToReset(socket.id);//the return value indicates whether all players agree to the reset
	    if (reset_agreement){
		myGame.resetGame(qty_tiles);
		//now sent out the new game object:
		var gameObj = myGame.getGameObject();
		io.emit('full game state transmission', gameObj);
	    }
	}
    });



    socket.on('player submits word', function(tile_id_array){
	console.log("Snatch Submission with letters: ",tile_id_array);

	var SnatchResponse = myGame.playerSnatches(tile_id_array, socket.id)

	if(SnatchResponse.val_check == 'accepted'){
	    io.emit('snatch assert', SnatchResponse.SnatchUpdateMsg);	    
	}else{
	    socket.emit('snatch rejected', SnatchResponse.val_check);
	}
    });




    //client requests to turn over a tile
    socket.on('tile turn request', function(blank_msg){
	var newTile_info = myGame.flipNextTile(socket.id);
	io.emit('new turned tile', newTile_info);
	if(newTile_info){
	    console.log("PI=" + newTile_info.flipping_player + " flips tileID=" + newTile_info.tile_index + " (" + newTile_info.tile_letter + ")");
	}else{
	    console.log("All tiles turned - flip message recieved...");
	}
    });


    //client requests to turn over a tile
    socket.on('many_tile_turn_hack', function(n_tiles){

	var letters = [];
	var tileID_first = undefined;
	var tileID_final = undefined;
	var fl_player = undefined;
	var period = 100;

	var R1 = function(i){
	    var newTile_info = myGame.flipNextTile(socket.id);
	    if(newTile_info){
		io.emit('new turned tile', newTile_info);
		letters.push(newTile_info.tile_letter);
		tileID_final = newTile_info.tile_index
		fl_player = newTile_info.flipping_player;
		if(i==0){tileID_first = newTile_info.tile_index;}
		if(i < n_tiles){setTimeout(function(){R1(i+1);},period);}//here is the recursive call achieving simple looping...
	    }
	    if(i >= n_tiles){
		if(tileID_final !== undefined){
		    console.log("PI=" + fl_player + " has turned multiple tiles at once, from\
tileID=" + tileID_first + " to tileID=" + tileID_final + ". The letters are: " + letters);
		}else{
		    console.log("All tiles turned");
		}

	    }
	};
	R1(0);

    });


});

http.listen(3008,'127.0.0.1');
console.log('Snatch server, listening on 127.0.0.1:3008');
