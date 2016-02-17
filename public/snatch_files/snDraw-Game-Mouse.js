snDraw.Game.Mouse = {
    //global variables
    significant_drag: false,

    //TODO: (n.b. given that there's only one mouse but the recorded coordinates here too...
    
    mDown: function (e) {
	my_tile_index = e.target.tileID;
	if(my_tile_index !== undefined){//for when a click landed on a tile...
	    if(tileset[my_tile_index].status=="unturned"){
		tileTurnObj = {
		    playerIndex: client_player_index,
		    tileID: my_tile_index
		}
		var ObjStr = JSON.stringify(tileTurnObj);
		TILE_TURN_REQUEST(ObjStr);//for an unturned tile, always message to flip
	    }
	    if(tileset[my_tile_index].status=="turned"){//click on a turned tile. Log coords of start of drag
		this.recordDragStartCoords(e.target);
		//Actually upon pickup of an active tile, add the event listener to potentially move other tiles around beneath...
		// this is really only for the fresh word create case?
		if(e.target.visual=="ACTIVE"){
		    this.significant_drag = false;
		    var count = 0;
		    e.target.on('moving',function (o){
			snDraw.Game.Spell.shuffleAnagramDrag(e.target);
			count++;
			if (count % 5 == 0){//an attempted efficiency boost
			    var pointer = canvas.getPointer(e.e);
			    snDraw.Game.Mouse.significant_drag = snDraw.Game.Mouse.significant_drag || snDraw.Game.Mouse.significantMovement(e.target,pointer);
			}
		    });
		}
	    }
	}
	//it's important this comes before the button handlers, or the window will get drawn then removed.
	if(snDraw.Game.Controls.playersListWindowVisible){
	    snDraw.Game.Controls.removePlayersListWindow();
	}
	//for handling mouse down on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){ //implies the click landed on a button...
	    snDraw.Game.Controls.buttonRecolor(e.target,"press"); // visual
	    if(GCindex == 0){  snDraw.Game.Controls.cancelWordButtonHandler();   }
	    if(GCindex == 1){  snDraw.Game.Controls.snatchItButtonHandler();     }	    
	    if(GCindex == 2){  snDraw.Game.Controls.playersListButtonHandler();  }	    
	    if(GCindex == 3){  snDraw.Game.Controls.resetGameButtonHandler();    }
	}
    },

    mUp: function (e) {
	my_tile_index = e.target.tileID;
	if(my_tile_index !== undefined){//for when a mouse up landed on a tile...

	    //this is for RELEASES that land on a blue tile in the free tiles area
	    if(tileset[my_tile_index].status=="turned"){
		if(e.target.visual=="flipped"){
		    if((!this.significantMovement(e.target)) ||
		       (this.draggedIntoPlayZone(e.target))){
			//move the tile into the ActiveGroup
			snDraw.Game.Spell.addLetter(e.target);
		    }
		}
		//ELSE is really important, because the first statement mutates data such that  that the second condition might then be met
		//this is for RELEASES that land on active tiles...
		else if(e.target.visual=="ACTIVE"){
		    if(this.verticalMovement(e.target) ||  //if the yellow letter is dragged up/down, remove it
		       (!this.significant_drag)){//if a click is released without a significant move, remove it
			snDraw.Game.Spell.removeLetter(e.target);

		    }else{
			snDraw.Game.Spell.shuffleAnagramRelease(e.target);
		    }
		}
	    }
	}

	//for handling "mouse:over" on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"normal");
	}
    },

    mOver: function (e) {

	//for handling "mouse:over" on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"hover");
	}

    },

    mOut: function (e) {

	//for handling "mouse:out" on the row of buttons accross the top.
	GCindex = e.target.gameButtonID;
	if(GCindex!==undefined){
	    snDraw.Game.Controls.buttonRecolor(e.target,"normal");
	}

    },


    significantMovement: function(MyTile, options){
	var final_x = undefined;
	var final_y = undefined;
	
	if(options){
	    final_x = options.x;
	    final_y = options.y;
	}else{
	    final_x = MyTile.getLeft();
	    final_y = MyTile.getTop();
	}
	var adx = Math.abs(MyTile.xPickup - final_x);
	var ady = Math.abs(MyTile.yPickup - final_y); 
	var threshold = snDraw.Game.tileSize * 0.1;
	return (adx>threshold) || (ady>threshold);
    },

    verticalMovement: function(MyTile){

	//getTop is the final position, and an a reduced Y coord (i.e. positive dy) implies upwards
	var ady = Math.abs(MyTile.yPickup - MyTile.getTop());
	var threshold = snDraw.Game.tileSize * 1.2;
	return ady>threshold;

    },

    recordDragStartCoords: function(MyTile){
	//assigning new attributes...
	MyTile.xPickup = MyTile.getLeft();
	MyTile.yPickup = MyTile.getTop();
	//log its old board coordinates in case it is to be returned
	if(MyTile.visual=="flipped"){
	    MyTile.x_availableSpace = MyTile.getLeft();
	    MyTile.y_availableSpace = MyTile.getTop();
	}
    },

    draggedIntoPlayZone: function(MyTile){
	return MyTile.getTop() > snDraw.Game.playersZoneTopPx - (snDraw.Game.tileSize * 0.9);
    }
};


snDraw.Game.KB = {

    kDown: function (e) {
	var myKeycode = e.keyCode;
	var keyPressed = String.fromCharCode(myKeycode);//note that this is non-case sensitive.

	if( (myKeycode >= 65) && (myKeycode <= 90) ){//any letter key
	    //
	    var grabit_tile_index = this.seachForTurnedTileOfLetter(keyPressed);
	    if (grabit_tile_index !== undefined){
		//
		var TargetTile = snDraw.Game.TileArray[grabit_tile_index];
		snDraw.Game.Mouse.recordDragStartCoords(TargetTile);
		console.log("checkpoint Q");
		snDraw.Game.Spell.addLetter(TargetTile); 
	    }
	    else{
		//take action if the user hits a letter and its not available.
		
		//TODO concider the detail and graphics for various scenarious of subsets of letters from word sources... (i.e. other peoples' words)
	    }
	}

	if(myKeycode == 32){//space bar
	    // let this be turn a letter
	    var target_tile_index = this.getLargestUnturnedTileIndex();
	    tileTurnObj = {
		playerIndex: client_player_index,
		tileID: target_tile_index
	    }
	    var ObjStr = JSON.stringify(tileTurnObj);
	    TILE_TURN_REQUEST(ObjStr);//for an unturned tile, always message to flip
	}

	if(myKeycode == 8){//delete key
	    // let this be remove the final letter of the spell (if present)
	    var SpellArray = snDraw.Game.Spell.ActiveLetterSet;
	    var LastTile = SpellArray[SpellArray.length-1];
	    snDraw.Game.Spell.removeLetter(LastTile);
	}

	if(myKeycode == 13){//enter key
	    // let this be submit word
	    snDraw.Game.Spell.SubmitWord();
	}

	if(myKeycode == 27){//escape key
	    // let this be cancel word
	}

	if(keyPressed == '1'){
	    //alert("hit 1");
	}
/*
	if(myKeycode == 16){//shift key
	
	}

	if(myKeycode == 17){//control key
	
	}
*/
    },

    getLargestUnturnedTileIndex: function(){
	var highest_unturned = undefined;
	for (var i=0; i<tileset.length; i++){
	    if (tileset[i].status == 'unturned'){
		highest_unturned = i;
	    } 
	}
	return highest_unturned;
    },

    seachForTurnedTileOfLetter: function(myletter){
	var tile_index_matching_letter = undefined;
	for (var i=0; i<tileset.length; i++){
	    if ((tileset[i].status == 'turned')&&(tileset[i].letter==myletter)){
		if(snDraw.Game.TileArray[i].visual != "ACTIVE"){
		    tile_index_matching_letter = i;
		}
	    } 
	}
	return tile_index_matching_letter;
    }
};
