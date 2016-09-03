snCore.Toast = {

    ToastCounter: 0,//create an integer_key for each toast
    ToastRolling: [],//rolling buffer (length up to 3 - tbc) holding the integer_key's for the dictionary above.
    ToastTop_consumed_words: 0,
    ToastTop_snatched_word: 0,
    ToastTop_client_words_final: 0,
    ToastTop_zone_inner_final: 0,

    reset_ToastTop_params: function(){
	this.ToastTop_consumed_words = 0;
	this.ToastTop_snatched_word = 0;
	this.ToastTop_zone_inner_final = 0;
	this.ToastTop_client_words_final = 0;
    },

    boundDimention: function(value, px_total, frac){
	if(frac.max != undefined){
	    value = Math.min(value, frac.max * px_total);
	}
	if(frac.min != undefined){
	    value = Math.max(value, frac.min * px_total);
	}
	return value
    },

    showToast: function(my_string, ToastOptions){

	//how do we reference back to this Toast (important in the placement process...)?
	var t_key = "toast-n" + this.ToastCounter; 
	this.ToastCounter++;
	
	this.ToastRolling.push(t_key); // rolling is a []

	//Actually the div of the new Toast class...
	var $NewToast = $( "<div/>", {id: t_key}).addClass("ToastGrey ToastCentral ToastIn").html(my_string);
	
	$("#canv-inside").append($NewToast);

	var toast_spacing = snCore.Tile.stdDimention * 0.18;
	//Determine the vertical position of the toast (start it at its highest potential position)
	var ClientZone_Title = snCore.Zones.PlayerZone[0].Zone_FabObjs[1];
	var ToastTop_current_client_zone_top = ClientZone_Title.top + ClientZone_Title.height;
	var Client_Words_Grps = snCore.Words.TileGroupsArray[client_player_index];
	var ToastTop_current_client_words = 0;
        for(var i = 0; i < Client_Words_Grps.length; i++){
	    ToastTop_current_client_words = Math.max(ToastTop_current_client_words, Client_Words_Grps[i].getTop());
        }

	var H_spacer = snCore.Tile.dims.ts + snCore.Tile.stdDimention * 0.35;
	var toast_top = Math.max(this.ToastTop_consumed_words + H_spacer,
				 this.ToastTop_snatched_word + H_spacer,
				 this.ToastTop_zone_inner_final,
				 this.ToastTop_client_words_final + H_spacer,
				 ToastTop_current_client_words +  H_spacer,
				 ToastTop_current_client_zone_top);
	this.reset_ToastTop_params();

	//Now this bit relates to fitting it around toasts which may already be there...
	for(var i = 0; i < this.ToastRolling.length; i++){
	    var t_key_i = this.ToastRolling[i];
	    var $ExistingToast = $("#"+t_key_i);


	    //trap it in the loop by reverting i to zero until it escapes interference with any other Toasts...
	    var Toast_i_top = $ExistingToast.position().top;
	    var Toast_i_height = $ExistingToast.outerHeight();
	    var Toast_i_bot = Toast_i_top + Toast_i_height + toast_spacing;
	    var toast_height = $NewToast.outerHeight();
	    var toast_bot = toast_top + toast_height + toast_spacing;
	    //a smaller vertical coordinate means higher up on screen...
	    //is there interference

	    if((Toast_i_top <= toast_bot)&&(Toast_i_bot >= toast_top)){//Interference detected
		toast_top = Toast_i_bot + 0.5;//shuffle down the candidate position
		i = -1;//reset the loop (it will get imcremented, so must here make it -1.
	    }else{
		// huh?
	    }
	}

	$NewToast.css("top", (toast_top + "px"));

	//toasts scaling (there are some more...)
	//TODO: this styling code which applies to all toasts should be elsewhere
	// why can't I use jQuery to change the properties of the CSS class universally whilst no objects of that class exist?
	var sd = snCore.Tile.stdDimention;
	$NewToast.css("font-size", (sd*0.35)+"px");
	$NewToast.css("-moz-border-radius", (sd*0.1)+"px");
	$NewToast.css("-webkit-border-radius", (sd*0.1)+"px");
	$NewToast.css("border-radius", (sd*0.1)+"px");

	/*
	ToastOptions = {
	    persistent: boolean
	    HTML_frag: <object, jQuery>
	    holdable: boolean
	    via_KB: boolean (for the case where Toast was triggered via the keyboard, alter its disappearance behaviour)
	    ToastType: string (the options are: 'defn', etc....)
	}
	*/

	// Apply options to the generated Toast...
	if (ToastOptions == undefined){
	    //the default behaviour
	    this.setToastRemTimeout(t_key);
	}else{
	    if(ToastOptions.persistent == true){
		// add cross in corner to close it
		var crn_cross = $('<div/>').addClass("ToastClose").text("×");
		$NewToast.prepend(crn_cross);
		crn_cross.click(function(){
		    snCore.Toast.setToastRemTimeout(t_key, {instant: true});});
		// it'll close by itself in a minute...
		this.setToastRemTimeout(t_key, {duration: 60000});
		// it will get
		this.persistent_toast_list_byKey.push(t_key);
	    }else{
		// also use this behaviour when not persistent
		this.setToastRemTimeout(t_key);
	    }

	    if(ToastOptions.ToastType !== undefined){
		$NewToast.addClass("typeClass-"+ToastOptions.ToastType);
	    }

	    if(ToastOptions.HTML_frag !== undefined){
		$NewToast.html("").append(ToastOptions.HTML_frag);
	    }

	    if(ToastOptions.holdable == true){
		var via_kb = ToastOptions.via_KB == true;

		var stop_msg_str = (via_kb?"Hit 6 again":"click") + " to hold in view";
		var stop_msg = $('<div/>', {id: "m1"+t_key}).addClass("ToastStop S1").text(stop_msg_str);

		//clear the 'hold' message
		if(via_kb){
		    setTimeout(function(){
			if($("#m1"+t_key).text().includes("Hit 6")){
			    $("#m1"+t_key).text("");
			}
		    }, 1200);
		}

		$NewToast.prepend(stop_msg).click(function(){
		    snCore.Toast.holdToast(t_key, via_kb);
		});
	    }
	}

	//any <a href> into new windows... (this will apply to links in str or frags...)
	$NewToast.find( "a" ).attr("target","_blank");
	$NewToast.find( ".samewin" ).attr("target","_self");

	return t_key;
    },

    holdToast: function(t_key, via_kb){
	var this_toast = $("#"+t_key);
	snCore.Toast.setToastRemTimeout(t_key, {duration: 120000});//2 minutes
	$("#m1"+t_key).removeClass("S1").addClass("S2").text((via_kb?"ESC":"click")+" to clear");
	this_toast.click(function(){//get rid of
	    snCore.Toast.setToastRemTimeout(t_key, {instant: true});
	});
    },

    /*
    ToastRemovalOptions = {
	duration: int
	instant: boolean
    }
    */

    //these hash tables use t_key as their keys
    // TODO: can't 3 hash tables be combined into one, given they use the same keys? This is housekeeping work.
    timeoutIDs: {},
    Active_byKey: {},

    //this will remove any existing timeouts to remove the toast indexed by t_key
    setToastRemTimeout: function(t_key, ToastRemovalOptions){

	// default options values
	var toast_duration = 4000;
	var fast = false;

	if (ToastRemovalOptions != undefined){
	    fast = ToastRemovalOptions.instant || fast;
	    toast_duration = ToastRemovalOptions.duration || toast_duration;
	}

	var new_timoutID = setTimeout(function(){
	    
	    $("#"+t_key).removeClass("ToastIn");
	    $("#"+t_key).addClass("ToastOut");

	    setTimeout(function(){

		//find the array index of the toast concerned (by its key)
		var roll_index = snCore.Toast.ToastRolling.indexOf(t_key);
		//remove this toast key from the array: it is GONE!
		snCore.Toast.ToastRolling.splice(roll_index, 1);
		$("#"+t_key).remove();
		snCore.Toast.Active_byKey[t_key] = false;

	    }, 400 + 10);//delete 10ms after fade out is complete.

	}, fast?10:toast_duration);

	var old_timeoutID = this.timeoutIDs[t_key];
	this.timeoutIDs[t_key] = new_timoutID;
	clearTimeout(old_timeoutID);
	this.Active_byKey[t_key] = true;
    },

    persistent_toast_list_byKey: [],
    clear_all_persistent: function(){
	$.each(this.persistent_toast_list_byKey, function( index, value ) {
	    snCore.Toast.setToastRemTimeout(value, {instant: true});
	});
    },

    clear_all: function(){
	for (var my_tk in this.Active_byKey) {
	    if (this.Active_byKey.hasOwnProperty(my_tk)) {
		snCore.Toast.setToastRemTimeout(my_tk, {instant: true});//the true means clear fast...
	    }
	}
    },

    clear_all_definitions: function(){
	for (var my_tk in this.Active_byKey) {
	    if (this.Active_byKey.hasOwnProperty(my_tk)) {
		//test if it is a definition toast (type information stored in DOM)
		if($("#"+my_tk).hasClass("typeClass-defn")){
		    snCore.Toast.setToastRemTimeout(my_tk, {instant: true});//the true means clear fast...
		}
	    }
	}
    },

    join_message: function(){
	// (I've put a moment of delay here. Probably UNNECESSARY TO USE TIMEOUT
	setTimeout(function(){
	    var pss = players.length;
	    var pss_inac = 0;

	    for(var i = 0; i < players.length; i++){
		if (players[i].is_disconnected){
		    pss_inac++;
		}
	    }

	    var pss_oth = pss-pss_inac-1;
	    var partipicants = [];
	    var singular = false;
	    if(pss_inac>0){
		partipicants.push(pss_inac + " disconnected player"+(pss_inac==1?"":"s"));
		if(pss_inac==1){singular=true;}
	    }
	    if(pss_oth>0){
		partipicants.push(pss_oth + " active player"+(pss_oth==1?"":"s"));
		if(pss_oth>1){singular=false;}
	    }

	    var mGam = " in this "+(snCore.Event.game_ended?"(finished) ":"")+"game";

	    var msg = "You are the only player" + mGam;
	    var sss = singular?"is ":"are ";
	    if(partipicants.length==1){
		var msg = "There " + sss + partipicants[0] + " and you" + mGam;
	    }else if(partipicants.length==2){
		var msg = "There " + sss + partipicants[0] + ", " + partipicants[1] + " and you" + mGam;
	    }

	    //potentially add some more content to this Toast...
	    if(ip_comments.n_joins < 2){
		var msg2 = "<br>First ever game? View <a class=\"samewin\"href=\"#\" onclick=\"snCore.Popup.openModal('rules')\">Instructions</a>...";
		msg += msg2;
	    }

	    snCore.Toast.showToast(msg, {persistent: true});
	}, 20);
    },

    partial_completion_toast: function(PI_just_finished){
	// generate list of non-finished players...
	var n_pl = players.length;
	var str_nl = "";
	//todo: perhaps, in future, generate HTML and use player colors here...
	for(var i = 0; i < n_pl; i++){
	    var Plr = players[i];
	    if((!Plr.is_disconnected) && (!Plr.is_finished)){
		str_nl += (i == client_player_index ? "you" : Plr.name) + (i < (n_pl-1) ? ", ":"");
	    }
	}

	var str_tot = "";
	if(PI_just_finished != null){
	    if(PI_just_finished == client_player_index){
		str_tot += "You have";
	    }else{
		str_tot += players[PI_just_finished].name + " has";
	    }
	    str_tot += " finished.<br>Now waiting";
	}else{
	    str_tot += "Waiting";
	}
	str_tot += " for " + str_nl + " (after which final scores will show)";
	snCore.Toast.showToast(str_tot);
    },

    game_fin: function(){
	snCore.Toast.showToast("The game is now finished");
    }

};
