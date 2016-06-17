snDraw.Game.Popup = {

    //Properties of this class...
    popup_in_foreground: false,

    //Methods of this class...
    
    calcModalScale: function(){
	
	//things that scale with the Tile Size
	var ts = Math.round(snDraw.Game.stdDimention);
	var cr = ts * 0.30; // corner radius
	var fsz = ts * 0.50; // master font size

	//set style properties that depend on tile size...
	$("#modal_dark_sheet").css("font-size", fsz+"px");
	$("#modal-content").css("border-radius", cr+"px");
	$("#modal-header").css("border-radius", cr+"px "+cr+"px 0 0");
	$("#modal-footer").css("border-radius", "0 0 "+cr+"px "+cr+"px");
	$("#modal-body").css("max-height", snDraw.canv_H * 0.8+"px");

	//change the scale associated with those words with a black haze.
	$('.blacken').css({"text-shadow":"0px 0px "+fsz*0.05+"px black, 0px 0px "+fsz*0.1+"px black"});
    },

    generate_scores_table_html_element: function(){

	// 3. Extract the data
	var player_scores_list = [];
	//extact scores from players stat structure:
	for(var i = 0; i < players.length; i++){
	    var player_i_score = 0;
	    for(var j = 0; j < players[i].words.length; j++){
		player_i_score += Math.max(1,players[i].words[j].length-2);
	    }
	    player_scores_list.push({
		p_index: i,
		score: player_i_score
	    });
	}

	function comparePlayers(a, b) {
	    return a.score - b.score;
	}
	player_scores_list.sort(comparePlayers);
	player_scores_list.reverse();

	var doc = document;
	var fragment = doc.createDocumentFragment();

	//Just create the table headings...
	var tr = doc.createElement("tr");
	var th1 = doc.createElement("th");
	th1.innerHTML = "Name";
	th1.className = "scores scores-underline";
	tr.appendChild(th1);

	var th2 = doc.createElement("th");
	th2.innerHTML = "Score";
	th2.className = "scores scores-underline";
	tr.appendChild(th2);

	//does not trigger reflow
	fragment.appendChild(tr);
	
	var n_psl = player_scores_list.length;
	for(var i = 0; i < n_psl; i++){

	    var Plr = players[player_scores_list[i].p_index];

	    var tr = doc.createElement("tr");
	    var td1 = doc.createElement("td");
	    td1.innerHTML = (i+1)+ ". " + Plr.name;
	    td1.className = "scores pl-name" + (i != n_psl-1?" scores-underline":"");
	    tr.appendChild(td1);

	    var td2 = doc.createElement("td");
	    td2.innerHTML = player_scores_list[i].score.toString();
	    tr.appendChild(td2);
	    td2.className = "scores pl-score" + (i<3?" blacken":"")+ (i != n_psl-1?" scores-underline":"");
	    td2.style["font-weight"] = (i<3?800:100);
	    td2.style["color"] = (i<3? Plr.color : 'black');

	    //does not trigger reflow
	    fragment.appendChild(tr);

	}

	var table = doc.createElement("table");
	table.appendChild(fragment);

	return table;
    },

    modal_content_updater_timeout: undefined,
    openModal: function(type){
	var Title = "my Title";
	var Body = "my content id";
	var Footer = "my footer id";
	if(type=="scores"){
	    
	    Title = "Players";
	    Body = "modal-body-scores-table";
	    Footer = snDraw.Game.Controls.client_finished_game ? "modal-footer-close-replay" : "modal-footer-simple-close"; 

	    // dynamically change content by regenerating the scores table...
	    $("#modal-body-scores-table").html(this.generate_scores_table_html_element());

	}else if(type=="options"){

	    Title = "Options";
	    Body = "modal-body-options-menu";
	    Footer = "modal-footer-simple-close";
	    
	    //dynamic.
	    initiate_copy_box();

	}else if(type=="connection"){

	    Title = "Connection Lost";
	    Body = "modal-body-lost-connection";
	    Footer = "modal-footer-rejoin";

	    //dynamic.
	    function update_latency_html(){
		$("#connection-latency").html(Math.round(get_max_latency()/1000,1));
		snDraw.Game.Popup.modal_content_updater_timeout = setTimeout(update_latency_html, 1000);
	    }
	    update_latency_html();//herby start the chain...	    

	}else if(type=="rules"){
	    Title = "Instructions";
	    Body = "modal-body-flickity-rules";
	    Footer = "modal-footer-simple-close";
	}

	//Inject the Title
	$("#box-title").html(Title);
	//Setting Modal BODY
	this.setVisibleModalContent("#modal-body", Body);
	this.setVisibleModalContent("#modal-footer", Footer);

	// only activate if not already present. The other possibility is that modal's content will have been replaced live.
	if(this.popup_in_foreground == false){
	    this.activateModal();
	}

	//record which popup is currently on display...
	this.popup_in_foreground = type;


    },

    // Generic stuff required for presence of the modal
    activateModal: function(){

	// 1. Reveal the DIV which is the dark background with message on it
	var ds = document.getElementById("modal_dark_sheet");
	ds.style["display"] = "block";

	// 2. clicking the background closes the message
	// the behavior takes half a second to become active (Touchscreen niggle fix)
	ds.onclick = undefined;
	setTimeout(function(){
	    ds.onclick = function(event) {
		if (event.target == ds) {
		    snDraw.Game.Popup.hideModal();
		}
	    };
	}, 500);

	// 3. the x button closes the window...
	document.getElementById("close").onclick = function() {
	    snDraw.Game.Popup.hideModal();
	};

	// 4. set the scale correctly:
	this.calcModalScale();

    },

    hideModal: function(){
	$("#modal_dark_sheet").css("display", "none");
	clearTimeout(this.modal_content_updater_timeout);
	this.popup_in_foreground = false;
    },

    setVisibleModalContent: function(section, content_id){
	$(section).children().each(function(){
	    var div_id = $(this).attr('id');
	    var set_disp = "none";
	    if(div_id == content_id){
		set_disp = "block";
	    }
	    $(this).css("display", set_disp);
	});
    },

    gotoHomePage: function(){
	var homeURL = window.location.href.split('join')[0];
	window.location.href = homeURL;
	
    }
};
