var game = {

	// saved with savegames in order to keep track of versions:
	VERSION:"0.0.1", // invalidates saves on change!

	// Static (not saved):
	building_def:{
		gold_mine:{
			category:"economic",
			name:"Gold Mine",
			tooltip:"Extract gold from its earthly mantle to power your engine of pain.",
			cps_prefix:"",
			cps_suffix:" g / second",
			costs:[
				['gold',50,3.2]
			]
		},
		gold_tower:{
			category:"economic",
			name:"Gold Tower",
			tooltip:"A gold mine at the top of a tower, which makes it more powerful.",
			cps_prefix:"",
			cps_suffix:" g / second",
			costs:[
				['gold',10000,3]
			]
		},
		water_mill:{
			category:"economic",
			name:"Water Mill",
			tooltip:"Generate electricity with the latest technologies.",
			cps_prefix:"",
			cps_suffix:" electricity",
			costs:[
				['gold',500,4]
			]
		},
		research_lab:{
			category:"research",
			name:"Research Lab",
			tooltip:"These buildings find things out for you.",
			cps_prefix:"",
			cps_suffix:" research / second",
			costs:[
				['gold',150,4]
			]
		},
		kung_fu_academy:{
			category:"combat",
			name:"Kung-Fu Academy",
			tooltip:"Punch and kick better with more academies.",
			cps_prefix:"",
			cps_suffix:" dps",
			costs:[
				['gold',500,3.5],
				['research',100,4]
			]
		},
		power_armour:{
			category:"combat",
			name:"Power Armour",
			tooltip:"Harness U power to provide a combat strength multiplier.",
			cps_prefix:"",
			cps_suffix:" combat multi",
			costs:[
				['gold',1000000,10],
				['research',1000,2],
				['electricity',1,1]
			]
		}
	},

	resource_def: {
		gold:{
			name:"Gold",
			tooltip:"Delicious gold",
			utype:"quantity",
			dom:[],
			dom_cps:[],
			statusbar:true
		},
		research:{
			name:"Research",
			tooltip:"How to kung fu and build power armour mostly",
			utype:"quantity",
			dom:[],
			dom_cps:[],
			statusbar:true
		},
		electricity:{
			name:"Electricity",
			tooltip:"One unit is around 1.4PW",
			utype:"limit",
			dom:[],
			dom_cps:[],
			statusbar:true
		},
		dps:{
			name:"DPS",
			tooltip:"How much damage you do EVERY SECOND",
			utype:"quantity",
			dom:[],
			dom_cps:[],
			statusbar:true
		}
	},

	upgrade_def: {
		mining:{
			name:"Mining",
			tooltip:"mining",
			link:"gold_mine",
			start_level:10,
			increment:10,
			current_level:0,
			costs:[
				['gold',500,5],
				['research',100,6]
			]
		},
		towering:{
			name:"Towering",
			tooltip:"mining",
			link:"gold_tower",
			start_level:10,
			increment:10,
			current_level:0,
			costs:[
				['gold',4000,5],
				['research',300,6]
			]
		},
		research:{
			name:"Research",
			tooltip:"mining",
			link:"research_lab",
			start_level:10,
			increment:10,
			current_level:0,
			costs:[
				['gold',1000,5.5],
				['research',100,8]
			]
		},
		kungfu:{
			name:"Martial Arts",
			tooltip:"mining",
			link:"kung_fu_academy",
			start_level:10,
			increment:10,
			current_level:0,
			costs:[
				['gold',500,5.2],
				['research',1000,5]
			]
		},
	},

	// game state (save):
	upgrades: {},
	buildings: {},
	resources: {},

	monsters_killed:0,

	current_enemy: {
		name:'',
		hp:0,
		hp_max:0
	},

	// cache (don't save, regenerated on load):
	costs: {},
	upgrade_costs: {},
	resource_gains: {},
	static_gains: {},

	last_tick:0,


	save_game: function() {

		var save_data={
			v:this.VERSION,
			u:this.upgrades,
			b:this.buildings,
			r:this.resources,
			m:this.monsters_killed,
			c:this.current_enemy
		};

		var saveString=base64_encode(JSON.stringify(save_data));

		console.log("Saved!");

		localStorage.setItem('save',saveString);
	},

	load_game: function() {
		var lData=localStorage.getItem('save');

		if (!lData || lData=="del") { return false; }

		var dcData=JSON.parse(base64_decode(lData));
		console.log("Game loaded");

		if (dcData.v!=this.VERSION) {
			$( "#dialog-oldsave" ).dialog({
				modal: true,
				buttons: {
					"Fuck off": function() { $( this ).dialog( "close" ); }
				}
			});
			return false;
		}

		this.upgrades=dcData.u;
		this.buildings=dcData.b;
		this.resources=dcData.r;
		this.monsters_killed=dcData.m;
		this.current_enemy=dcData.c;

		this.display_enemy();

		return true;
	},

	create_enemy:function() {

		var power_level=this.monsters_killed+1;
		var boss=((power_level%10)==0);

		if (boss) {
			this.current_enemy.name=strings.enemy_prefixes[Math.floor(Math.random() * strings.enemy_prefixes.length)] + " " + strings.boss_nouns[Math.floor(Math.random() * strings.boss_nouns.length)] + " the " + strings.enemy_prefixes[Math.floor(Math.random() * strings.enemy_prefixes.length)];

			this.current_enemy.hp_max=(power_level*power_level*6)+(2000*power_level*0.5);
		} else { 
			this.current_enemy.name=strings.enemy_prefixes[Math.floor(Math.random() * strings.enemy_prefixes.length)] + " " + strings.enemy_nouns[Math.floor(Math.random() * strings.enemy_nouns.length)];

			this.current_enemy.hp_max=(power_level*power_level*6)+(500*power_level*0.5);
		}

		this.current_enemy.hp=this.current_enemy.hp_max;
		this.display_enemy();
	},

	display_enemy:function() {
		var power_level=this.monsters_killed+1;
		$("#enemy_display").text(this.current_enemy.name+" ("+this.fn(power_level)+")");
		$("#enemy_hp_max").text(this.current_enemy.hp_max + " (+"+(this.fn(Math.floor(Math.pow(this.monsters_killed+1,1.8))))+")");
	},

	do_damage:function() {

		if (this.current_enemy.hp <= 0) { 

			this.resources.gold+=this.current_enemy.hp_max*10;
			this.resources.research+=this.current_enemy.hp_max*2;
			
			this.monsters_killed+=1;
			this.create_enemy();
		}

		this.current_enemy.hp-=this.resources.dps;

		this.current_enemy.hp+=Math.floor(Math.pow(this.monsters_killed+1,1.8));

		if (this.current_enemy.hp > this.current_enemy.hp_max) { this.current_enemy.hp=this.current_enemy.hp_max; }

		$("#health_bar").css('width',((this.current_enemy.hp/this.current_enemy.hp_max)*100)+"%");
		$("#enemy_hp").text(this.fn(this.current_enemy.hp));
	},

	create_buttons: function() {
		for (var id in this.building_def) {

			var target="#economy_tab";
			if (this.building_def[id].category=="research") {
				target="#research_tab";
			} else if (this.building_def[id].category=="combat") {
				target="#combat_tab";
			}

			$(target).append('<li>'+
				'<button id="'+id+'_building" nid="'+id+'" class="desc_tooltip twelve columns ui-button ui-widget ui-corner-all" tip="'+this.building_def[id].tooltip+'">'+
					'<strong>'+this.building_def[id].name+'</strong><br />'+
					'Level <span id="'+id+'_level">0</span><br />'+
					this.building_def[id].cps_prefix+'<span id="'+id+'_cps">0</span>'+this.building_def[id].cps_suffix+' (<span id="'+id+'_cps_post">0</span>)<br />'+
					'<span id="'+id+'_nextcost">0</span>'+
				'</button>'+
			'</li>');					
		}

		for (var id in this.upgrade_def) {
			$("#upgrade_tab").append('<li>'+
				'<button id="'+id+'_upgrade" disabled nid="'+id+'" class="desc_tooltip twelve columns ui-button ui-widget ui-corner-all" tip="'+this.upgrade_def[id].tooltip+'">'+
					'<strong>'+this.upgrade_def[id].name+'</strong><br />'+
					'Level <span id="'+id+'_upgrade_level">0</span><br />'+
					'<span id="'+id+'_multi">0</span> multi<br />'+
					'<span id="'+id+'_nextcost">0</span>'+
				'</button>'+
			'</li>');
		}
	},

	button_handlers:function () {
		for (var id in this.building_def) {
			$("#"+id+"_building").click(function() {
				game.buy_building($(this).attr("nid"));
			});
		}

		for (var id in this.upgrade_def) {
			$("#"+id+"_upgrade").click(function() {
				game.do_upgrade($(this).attr("nid"));
			});
		}

		$("#save_game").click(function() {
			game.save_game();
		});

		$("#delete_game").click(function() {
			$( "#dialog-confirm" ).dialog({
				resizable: false,
				height: "auto",
				width: 400,
				modal: true,
				buttons: {
					"DO IT": function() {
						localStorage.setItem('save','del');
						location.reload();
					},
					"Let me rethink": function() {
						$( this ).dialog( "close" );
					}
				}
			});
		});
	},

	do_upgrade:function(id) {
		if (this.do_costs(this.upgrade_costs[id],true)) {

			this.upgrades[id]+=1;

			this.update_upgrades();
			this.update_counts();
			this.update_gains();
			this.update_costs();
		}

	},

	update_upgrades:function() {
		for (id in this.upgrade_def) {

			if (this.buildings[this.upgrade_def[id].link] >= (this.upgrade_def[id].start_level+((this.upgrades[id])*this.upgrade_def[id].increment))) {
				$("#"+id+"_upgrade").prop('disabled', false);
			} else {
				$("#"+id+"_upgrade").prop('disabled', true);
			}
		}
	},

	init_state:function() {
		for (var id in this.resource_def) {
			// init quantity storage
			this.resources[id]=0;
			this.resource_gains[id]=0;

			// init with status bar ids
			if (this.resource_def[id].statusbar) {
				if (this.resource_def[id].utype=="quantity") {
					this.resource_def[id].dom=['#'+id+'_display'];
					this.resource_def[id].dom_cps=[];
				} else if (this.resource_def[id].utype=="limit") {
					this.resource_def[id].dom=['#'+id+'_max'];
					this.resource_def[id].dom_cps=['#'+id+'_current'];
				}	
			}
		}

		for (var id in this.building_def) {
			this.buildings[id]=0;

			this.static_gains[id]=0; // stores cps (creation per second) for buildings
		}

		for (var id in this.upgrade_def) {
			this.upgrades[id]=0;
		}


	},

	buy_building:function(id) {

		if (this.do_costs(this.costs[id],true)) {

			this.buildings[id]+=1;

			this.update_upgrades();
			this.update_counts();
			this.update_gains();
			this.update_costs();
		}
		
	},

	do_costs:function(costs,commit) {

		var check=true;
		for (var k in costs) {
			if ( this.resources[k] < costs[k] ) {
				check=false;
			}
		}

		if (!commit || !check) { return check; }

		for (var k in costs) {
			this.resources[k] -= costs[k];
		}

		return true;

	},

	update_counts:function() {

		for (var id in this.building_def) {
			$("#"+id+"_level").text(this.fn(this.buildings[id]));
		}

		for (var id in this.upgrade_def) {
			$("#"+id+"_upgrade_level").text(this.fn(this.upgrades[id]));
			$("#"+id+"_multi").text(this.fn(this.upgrades[id]+1));
		}

	},

	update_gains:function() {

		// Explicit references to buildings allowed here

		// step 1, cps/multi per building
		this.static_gains.gold_mine=this.buildings.gold_mine*5;
		$("#gold_mine_cps").text(this.fn(this.static_gains.gold_mine));
		$("#gold_mine_cps_post").text(this.fn(this.static_gains.gold_mine*(this.upgrades.mining+1)));

		this.static_gains.gold_tower=this.buildings.gold_tower*60;
		$("#gold_tower_cps").text(this.fn(this.static_gains.gold_tower));
		$("#gold_tower_cps_post").text(this.fn(this.static_gains.gold_tower*(this.upgrades.towering+1)));

		this.static_gains.research_lab=this.buildings.research_lab*1;
		$("#research_lab_cps").text(this.fn(this.static_gains.research_lab));
		$("#research_lab_cps_post").text(this.fn(this.static_gains.research_lab*(this.upgrades.research+1)));

		this.static_gains.kung_fu_academy=this.buildings.kung_fu_academy*3;
		$("#kung_fu_academy_cps").text(this.fn(this.static_gains.kung_fu_academy));
		$("#kung_fu_academy_cps_post").text(this.fn(this.static_gains.kung_fu_academy*(this.upgrades.kungfu+1)));

		// step 2, apply in order
		var gold_cps=(this.static_gains.gold_mine*(this.upgrades.mining+1));
		gold_cps+=(this.static_gains.gold_tower*(this.upgrades.towering+1));
		this.resource_gains.gold=gold_cps;

		var resource_cps=this.static_gains.research_lab*(this.upgrades.research+1);
		gold_cps=gold_cps*this.upgrades.mining+1;
		this.resource_gains.research=resource_cps;

		var dps=this.static_gains.kung_fu_academy*(this.upgrades.kungfu+1);
		this.resources.dps=dps;
	},

	update_costs:function() {

		for (var id in this.building_def) {
			var cout={};
			var b=this.buildings[id]+1;
			for (var cost_id in this.building_def[id].costs) {

				if (b == 1) {
					cout[this.building_def[id].costs[cost_id][0]]=this.building_def[id].costs[cost_id][1]; // very first one is base cost (a little cheaper)
				} else {
					cout[this.building_def[id].costs[cost_id][0]]=(this.building_def[id].costs[cost_id][1]*b*0.5)+(this.building_def[id].costs[cost_id][2]*(b*b));
				}

			}

			this.costs[id]=cout;
			$("#"+id+"_nextcost").text(this.cost_string(id));
		}

		for (var id in this.upgrade_def) {
			var cout={};
			var b=this.upgrades[id]+1;
			for (var cost_id in this.upgrade_def[id].costs) {

				if (b == 1) {
					cout[this.upgrade_def[id].costs[cost_id][0]]=this.upgrade_def[id].costs[cost_id][1]; // very first one is base cost (a little cheaper)
				} else {
					var c = b*10;
					cout[this.upgrade_def[id].costs[cost_id][0]]=(this.upgrade_def[id].costs[cost_id][1]*c*0.5)+(this.upgrade_def[id].costs[cost_id][2]*(c*c));
				}

			}

			this.upgrade_costs[id]=cout;
			$("#"+id+"_nextcost").text(this.upgrade_cost_string(id));
		}

	},

	fn:function(n) {
		var nn = n.toExponential(3).split(/e/);
		var u = Math.floor(+nn[1] / 3);

		var pfx_str=parseFloat((nn[0] * Math.pow(10, +nn[1] - u * 3)).toFixed(3));

		//return pfx_str + ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'][u];
		return pfx_str + ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'KY', 'MY', 'GY', 'TY', 'PY', 'EY', 'ZY', 'YY', 'ZYY', 'MYY', 'GYY', 'TYY', 'PYY', 'EYY', 'ZYY', 'YYY', 'KYYY', 'MYYY'][u];
	},

	update_status:function() {
		for (var id in this.resource_def) {

			for (var i = this.resource_def[id].dom.length - 1; i >= 0; i--) {
				$(this.resource_def[id].dom[i]).text(this.fn(this.resources[id]));
			}

			for (var i = this.resource_def[id].dom_cps.length - 1; i >= 0; i--) {
				$(this.resource_def[id].dom_cps[i]).text(this.fn(this.resource_gains[id]));
			}
		}

	},

	upgrade_cost_string:function(id) {

		var out="";
		for (var cost_id in this.upgrade_def[id].costs) {
			out+=this.resource_def[this.upgrade_def[id].costs[cost_id][0]].name+" "+this.fn(this.upgrade_costs[id][this.upgrade_def[id].costs[cost_id][0]])+", ";
		}

		return out.slice(0,-2);

	},

	cost_string:function(id) {

		var out="";
		for (var cost_id in this.building_def[id].costs) {
			out+=this.resource_def[this.building_def[id].costs[cost_id][0]].name+" "+this.fn(this.costs[id][this.building_def[id].costs[cost_id][0]])+", ";
		}

		return out.slice(0,-2);

	},

	game_loop:function() {
		// CALLED FROM WINDOW CONTEXT, use game instead of this

		var diff=Date.now()-game.last_tick; // Time since last game_loop() call in ms
		game.last_tick=Date.now(); // set last_tick now so no time is 'lost' to processing

		for (var id in game.resource_gains) {
			game.resources[id]+=((game.resource_gains[id] / 1000) * diff);
		}

		game.do_damage();

		game.update_status();

		window.setTimeout(game.game_loop,400); // the actual game_loop timeout can be adjusted freely
	},

	save_loop:function() {
		game.save_game();
		window.setTimeout(game.save_loop,60000); // 1 minute
	},

	init:function() {
		// Library stuff
		$( "#building_tabs" ).tabs();
		$( "#status_tabs" ).tabs();

		$(document).tooltip({
			items: ".desc_tooltip",
			track: true,
			show: {delay: 1000},
			content: function() {
				return "<div>"+$(this).attr("tip")+"</div>";
			}
		});

		// Game init
		this.init_state();
		this.create_buttons();
		this.button_handlers();

		// Game initial state
		if (!this.load_game()) {
				this.resources.gold=100;
				this.create_enemy();
		}

		this.last_tick=Date.now()-1000; // start one second ago, lol

		this.update_upgrades();
		this.update_counts();
		this.update_gains();
		this.update_costs();
		this.game_loop();

		window.setTimeout(game.save_loop,15000); // 15 seconds to initial save
	}

};