game.import('extension',function(lib,game,ui,get,ai,_status){return {
	name:"胜负统计",
	content:function(config,pack){
		lib.skill._sftj_operateJl={//胜负记录操作
			enable:'phaseUse',
			filter:function(event,player){
				return player==game.me&&lib.config.extension_胜负统计_operateJl;
			},
			filterTarget:function(card,player,target){
				if(target.name.indexOf('unknown')==0&&(target.name2==undefined||target.name2.indexOf('unknown')==0)) return false;
				return true;
			},
			selectTarget:[0,Infinity],
			multitarget:true,
			multiline:true,
			prompt:'若选择角色则对这些角色的武将牌当前游戏模式的胜负记录进行操作，否则从所有武将包选择进行操作',
			log:false,
			charlotte:true,
			superCharlotte:true,
			content:function(){
				'step 0'
				targets.sortBySeat();
				if(targets.length){
					event.names=[];
					for(let i of targets){
						if(i.name.indexOf('unknown')) event.names.push(i.name);
						if(i.name2!=undefined&&i.name2.indexOf('unknown')) event.names.push(i.name2);
					}
					event.goto(4);
				}
				else{
					let ts=[];
					event.sorts=[];
					for(let i in lib.characterPack){
						if(Object.prototype.toString.call(lib.characterPack[i])==='[object Object]'){
							event.sorts.push(lib.characterPack[i]);
							ts.push(lib.translate[i+'_character_config']);
						}
					}
					if(!ts.length) event.finish();
					else{
						event.videoId=lib.status.videoId++;
						let func=function(player,list,id){
							let choiceList=ui.create.dialog('请选择要做记录操作的武将所在的武将包');
							choiceList.videoId=id;
							for(let i=0;i<list.length;i++){
								let str='<div class="popup text" style="width:calc(100% - 10px);display:inline-block">'+list[i]+'</div>';
								let next=choiceList.add(str);
								next.firstChild.addEventListener(lib.config.touchscreen?'touchend':'click',ui.click.button);
								next.firstChild.link=i;
								for(let j in lib.element.button){
									next[j]=lib.element.button[j];
								}
								choiceList.buttons.add(next.firstChild);
							}
							return choiceList;
						};
						if(game.me.isOnline2()) game.me.send(func,game.me,ts,event.videoId);
						event.dialog=func(game.me,ts,event.videoId);
						if(_status.auto) event.dialog.style.display='none';
						let next=game.me.chooseButton();
						next.set('dialog',event.videoId);
						next.set('forced',true);
						next.set('ai',function(button){
							return 1;
						});
						next.set('selectButton',[0,ts.length]);
					}
				}
				'step 1'
				if(game.me.isOnline2()) game.me.send('closeDialog',event.videoId);
				event.dialog.close();
				if(result.links&&result.links.length){
					let nums=result.links.sort();
					event.names=[];
					for(let num of nums){
						for(let i in event.sorts[num]){
							event.names.push(i);
						}
					}
					if(!event.names.length){
						alert('所选武将包不包含武将');
						event.finish();
					}
				}
				else event.finish();
				'step 2'
				player.chooseButton(['请选择要对当前游戏模式胜负记录进行操作的武将',[event.names,'character']],[1,Infinity]).ai=function(button){
					return 0;
				};
				'step 3'
				if(result.bool&&result.links) event.names=result.links;
				else event.finish();
				'step 4'
				player.chooseControl(['修改','删除','取消']).set('prompt','请选择要对所选武将当前游戏模式胜负记录进行的操作').set('ai',function(){
					return '取消';
				});
				'step 5'
				if(result.control=='取消') event.finish();
				else if(result.control=='删除'){
					let mode=get.statusModeInfo(true),cgn=get.sfConfigName(),num=0;
					if(cgn.length>1){
						for(let i of cgn){
							if(confirm('您确定要删除这'+event.names.length+'个武将'+mode+get.identityInfo(i)+'胜负记录吗？')){
								for(let name of event.names){
									if(lib.config[i][name]){
										delete lib.config[i][name];
										num++;
									}
								}
								game.saveConfig(i,lib.config[i]);
							}
						}
						if(num) alert('成功清除'+num+'条胜负记录');
					}
					else if(confirm('您确定要删除这'+event.names.length+'个武将'+lib.translate[get.mode()]+'模式'+mode+'胜负记录吗？')){
						for(let name of event.names){
							if(lib.config[i][name]){
								delete lib.config[cgn[0]][name];
								num++;
							}
						}
						game.saveConfig(cgn[0],{});
						if(num) alert('成功清除'+num+'条胜负记录');
					}
					event.finish();
				}
				else event.cgns=get.sfConfigName();
				'step 6'
				if(event.cgns.length>1){
					let trans=[];
					for(let i=0;i<event.cgns.length;i++){
						trans.push(get.identityInfo(event.cgns[i]));
					}
					trans.push('取消');
					player.chooseControl(trans).set('prompt','请选择要修改的胜负记录类型').set('ai',function(){
						return '取消';
					});
				}
				else if(!event.cgns.length) event.finish();
				else event._result={index:0,control:get.identityInfo(event.cgns[0])};
				'step 7'
				if(result.control=='取消') event.finish();
				else{
					event.cgn=event.cgns[result.index];
					event.num=0;
				}
				'step 8'
				if(!lib.config[event.cgn][event.names[event.num]]) lib.config[event.cgn][event.names[event.num]]={win:0,lose:0};
				event.prese=lib.config[event.cgn][event.names[event.num]].win;
				'step 9'
				let as=['+10'],sm=get.statusModeInfo(true);
				if(event.prese>=10) as.push('-10');
				as.push('+1');
				if(event.prese) as.push('-1');
				as.push('确定修改');
				as.push('不修改');
				player.chooseControl(as).set('prompt','获胜场数：<font color=#00FFFF>'+event.prese+'</font>').set('prompt2','<center>修改<font color=#FFFF00>'+(lib.translate[event.names[event.num]]||'未知')+'</font>'+sm+'<font color=#00FF00>'+get.identityInfo(event.cgn)+'</font>获胜场数记录</center><br><center>原获胜场数：<font color=#FF3300>'+lib.config[event.cgn][event.names[event.num]].win+'</font></center>').set('ai',function(){
					return '不修改';
				});
				'step 10'
				if(result.control=='确定修改'){
					lib.config[event.cgn][event.names[event.num]].win=event.prese;
					game.saveConfig(event.cgn,lib.config[event.cgn]);
				}
				else if(result.control=='不修改'){
					if(lib.config[event.cgn][event.names[event.num]].win+lib.config[event.cgn][event.names[event.num]].lose==0) delete lib.config[event.cgn][event.names[event.num]];
				}
				else{
					if(result.control=='+1') event.prese++;
					else if(result.control=='-1') event.prese--;
					else if(result.control=='+10') event.prese+=10;
					else if(result.control=='-10') event.prese-=10;
					event.goto(9);
				}
				'step 11'
				if(!lib.config[event.cgn][event.names[event.num]]) lib.config[event.cgn][event.names[event.num]]={win:0,lose:0};
				event.prese=lib.config[event.cgn][event.names[event.num]].lose;
				'step 12'
				let bs=['+10'],sd=get.statusModeInfo(true);
				if(event.prese>=10) bs.push('-10');
				bs.push('+1');
				if(event.prese) bs.push('-1');
				bs.push('确定修改');
				bs.push('不修改');
				player.chooseControl(bs).set('prompt','失败场数：<font color=#FF3300>'+event.prese+'</font>').set('prompt2','<center>修改<font color=#FFFF00>'+(lib.translate[event.names[event.num]]||'未知')+'</font>'+sd+'<font color=#00FF00>'+get.identityInfo(event.cgn)+'</font>失败场数记录</center><br><center>原失败场数：<font color=#00FFFF>'+lib.config[event.cgn][event.names[event.num]].lose+'</font></center>').set('ai',function(){
					return '不修改';
				});
				'step 13'
				let abb=lib.config[event.cgn][event.names[event.num]].win;
				if(result.control=='确定修改'){
					if(abb+event.prese==0) delete lib.config[event.cgn][event.names[event.num]];
					else{
						lib.config[event.cgn][event.names[event.num]].lose=event.prese;
						let all=abb+event.prese;
						if(all) lib.config[event.cgn][event.names[event.num]].sl=abb/all;
						else delete lib.config[event.cgn][event.names[event.num]];
					}
					game.saveConfig(event.cgn,lib.config[event.cgn]);
				}
				else if(result.control=='不修改'){
					if(abb+lib.config[event.cgn][event.names[event.num]].lose==0){
						delete lib.config[event.cgn][event.names[event.num]];
						game.saveConfig(event.cgn,lib.config[event.cgn]);
					}
				}
				else{
					if(result.control=='+1') event.prese++;
					else if(result.control=='-1') event.prese--;
					else if(result.control=='+10') event.prese+=10;
					else if(result.control=='-10') event.prese-=10;
					event.goto(12);
				}
				'step 14'
				event.num++;
				if(event.num<event.names.length) event.goto(8);
				'step 15'
				event.cgns.remove(event.cgn);
				if(event.cgns.length) event.goto(6);
			},
			ai:{
				result:{
					target:0
				}
			}
		};
		lib.translate._sftj_operateJl='<font color=#00FFFF>记录操作</font>';
		lib.skill._sftj_start={
			trigger:{global:'gameStart'},
			filter:function(event,player){
				if(player==game.me){
					game.countPlayer2(function(current){
						current.storage.sftj={
							cg1:current.name1,
							cg2:current.name2
						};
					});
					if(lib.config.extension_胜负统计_apart) return true;
				}
			},
			silent:true,
			priority:157,
			charlotte:true,
			superCharlotte:true,
			content:function(){
				get.sfInit();
			},
		};
		lib.skill._sftj_remove_duplicate = {//去重
			trigger: {global: ['gameStart', 'showCharacterEnd']},
			filter: function (event, player) {
				return lib.config.extension_胜负统计_qc && player == game.me;
			},
			silent: true,
			unique: true,
			priority: 729,
			charlotte: true,
			superCharlotte: true,
			content: function () {
				'step 0'
				if (!_status.sftjlist) {//未上场角色池
					let list = [];
					if (_status.connectMode) list = get.charactersOL();
					else for (let i in lib.character) {
						if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
						list.push(i);
					}
					game.countPlayer2(function (current) {
						list.remove(current.name);
						list.remove(current.name1);
						list.remove(current.name2);
					});
					_status.sftjlist = list;
				}
				let names = [],
					curs = game.filterPlayer().randomSort(),
					info;
				event.target = null;
				event.add = false;
				if (!_status.sftj_qc) _status.sftj_qc = [];
				for (let i = 0; i < curs.length; i++) {
					for (let j = 1; j < 3; j++) {
						info = curs[i]['name' + j];
						if(typeof info!='string' || info.indexOf('unknown')==0 || _status.sftj_qc.contains(info)) continue;
						let find=false;
						if(names.contains(info)) find=true;
						else for(let key of names){
							let index=key.split('_');
							index=index[index.length-1].split('');
							find=true;
							for(let check=info.length-1;check>=0;check--){
								let com=index.pop();
								if(com!=info[check]){
									find=false;
									break;
								}
								if(index.length==0){
									if(check>0&&info[check-1]!='_') find=false;
									break;
								}
							}
							if(find) break;
						}
						if (find) {
							event.target = curs[i];
							event.num = j-1;
							break;
						}
						else names.push(info);
					}
				}
				if (event.target) {
					let sd = _status.mode,
						name,
						qcp = lib.config.extension_胜负统计_qcp,
						curs;
					if (get.mode() == 'single' && sd == 'dianjiang') {
						if (!localStorage.getItem('gjcx_single_alerted')) {
							localStorage.setItem('gjcx_single_alerted', true);
							alert('当前模式为点将模式，不在［武将登场去重］功能管辖范围内');
						}
						event.finish();
						return;
					}
					if (event.num) name = event.target.name2;
					else name = event.target.name1;
					if ((game.me == event.target && qcp != 'zc') || event.target == game.boss || get.mode() == 'boss' && event.target.identity == 'zhong' || event.target == game.trueZhu || event.target == game.falseZhu) {
						curs = game.filterPlayer(function (current) {
							if (current == game.boss || get.mode() == 'boss' && current.identity == 'zhong' || current == game.trueZhu || current == game.falseZhu) return false;
							for (let j = 1; j < 3; j++) {
								info = current['name' + j];
								if(typeof info!='string' || info.indexOf('unknown')==0) continue;
								let find=false;
								if(name==info) find=true;
								else{
									let index=name.split('_');
									index=index[index.length-1].split('');
									find=true;
									for(let check=info.length-1;check>=0;check--){
										let com=index.pop();
										if(com!=info[check]){
											find=false;
											break;
										}
										if(index.length==0){
											if(check>0&&info[check-1]!='_') find=false;
											break;
										}
									}
									if(find) break;
								}
								if (find) {
									event.num = j - 1;
									return true;
								}
							}
							return false;
						});
						if (!curs.length) event.target = null;
						else if (qcp == 'zc') event.target = curs.randomGet();
						else {
							let me = false;
							if (curs.contains(game.me)) {
								me = true;
								curs.remove(game.me);
							}
							if (curs.length) event.target = curs.randomGet();
							else if (me && qcp != 'no') event.target = game.me;
							else event.target = null;
						}
					}
					if (!event.target) {
						alert(get.translation(name) + '受情景约束，不能替换');
						_status.sftj_qc.push(name);
						event.finish();
						return;
					}
					let ts = _status.sftjlist.randomSort(),
						list = [],
						str,
						hx = 6,
						id = event.target.identity;
					if (lib.config.extension_胜负统计_qcs == 'same') switch (get.mode()) {
						case 'identity':
							if (sd == 'zhong') {
								if (id == 'fan' || id == 'zhong') hx = 6;
								else hx = 8;
							} else if (sd == 'purple') {
								if (id.indexOf('Zhu') == 1) hx = 4;
								else hx = 5;
							} else hx = get.config('choice_' + id);
							break;
						case 'versus':
							if (sd == 'two') hx = 7;
							else if (sd == 'guandu') hx = 4;
							else hx = 8;
							break;
						case 'doudizhu':
							if (sd == 'normal') hx = get.config('choice_' + id);
							else if (id == 'zhu') {
								if (sd == 'kaihei') hx = 5;
								else if (sd == 'huanle' || sd == 'binglin') hx = 7;
								else hx = 4;
							} else {
								if (sd == 'kaihei') hx = 3;
								else hx = 4;
							}
							break;
						default:
							if (typeof get.config('choice_' + id) == 'number') hx = get.config('choice_' + id);
					}
					else hx = parseInt(lib.config.extension_胜负统计_qcs);
					for (let i = 0; i < ts.length; i++) {
						if(player!=game.me&&lib.config.extension_胜负统计_wj.contains(ts[i])) continue;
						list.push(ts[i]);
						if (list.length >= hx) break;
					}
					if (!list.length) {
						alert('没有可供候选的武将！');
						event.finish();
						return;
					}
					if (event.target == game.zhu && (game.players.length > 4 || game.players.length == 4 && sd == 'normal' && lib.config.extension_AI优化_fixFour) || id && (id == 'mingzhong' || id.indexOf('Zhu') > 0) || event.target == game.friendZhu || event.target == game.enemyZhu) event.add = true;
					if (event.target.name2 == undefined) str = '武将';
					else if (event.num) str = '副将';
					else str = '主将';
					if (lib.config.extension_胜负统计_delayQc != '0') game.delay(parseInt(lib.config.extension_胜负统计_delayQc));
					if (list.length == 1) event._result = {links: list};
					else event.target.chooseButton(true, ['请选择一张武将牌替换你的' + str, [list, 'character']]).ai = function (button) {
						return get.rank(button.link);
					};
				} else event.finish();
				'step 1'
				let name = result.links[0],
					j = '将',
					old = event.target.name1;
				_status.sftjlist.remove(name);
				if (event.num) {
					j += '副将';
					old = event.target.name2;
					_status.sftjlist.push(event.target.name2);
					event.target.init(event.target.name1, name);
				} else {
					_status.sftjlist.push(event.target.name1);
					if (event.target.name2 != undefined) {
						j += '主将';
						event.target.init(name, event.target.name2);
					} else event.target.init(name);
				}
				if (event.add) {
					event.target.maxHp++;
					event.target.hp++;
				}
				if (!lib.character[name] || !lib.character[name][4] || !lib.character[name][4].contains('hiddenSkill')) event.target.showCharacter(event.num, false);
				game.log('#g'+get.cnNumber(player.getSeatNum()+1)+'号位', j, '#y' + (lib.translate[old]||'未知'), '更换为', '#y' + (lib.translate[name]||'未知'));
				'step 2'
				event.target.update();
				event.trigger('showCharacterEnd');
			}
		};
		lib.skill._sftj_fake_prohibited = {//伪禁
			trigger: {
				global: 'gameStart',
				player: 'showCharacterEnd'
			},
			filter: function (event, player) {
				return lib.config.extension_胜负统计_Wj && player != game.me && lib.config.extension_胜负统计_wj;
			},
			silent: true,
			unique: true,
			priority: 1024,
			charlotte: true,
			superCharlotte: true,
			content: function () {
				'step 0'
				if (!_status.sftjlist) {//未上场角色池
					let list = [];
					if (_status.connectMode) list = get.charactersOL();
					else for (let i in lib.character) {
						if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
						list.push(i);
					}
					game.countPlayer2(function (current) {
						list.remove(current.name);
						list.remove(current.name1);
						list.remove(current.name2);
					});
					_status.sftjlist = list;
				}
				if (player.name1 != undefined && lib.config.extension_胜负统计_wj.contains(player.name1)) event.num = 0;
				else if (player.name2 != undefined && lib.config.extension_胜负统计_wj.contains(player.name2)) event.num = 1;
				else event.finish();
				'step 1'
				let list = [],
					hx = 6,
					sd = _status.mode,
					id = player.identity,
					str;
				if (lib.config.extension_胜负统计_wjs == 'same') switch (get.mode()) {
					case 'identity':
						if (sd == 'zhong') {
							if (id == 'fan' || id == 'zhong') hx = 6;
							else hx = 8;
						} else if (sd == 'purple') {
							if (id.indexOf('Zhu') == 1) hx = 4;
							else hx = 5;
						} else hx = get.config('choice_' + id);
						break;
					case 'versus':
						if (sd == 'two') hx = 7;
						else if (sd == 'guandu') hx = 4;
						else hx = 8;
						break;
					case 'doudizhu':
						if (sd == 'normal') hx = get.config('choice_' + id);
						else if (id == 'zhu') {
							if (sd == 'kaihei') hx = 5;
							else if (sd == 'huanle' || sd == 'binglin') hx = 7;
							else hx = 4;
						} else {
							if (sd == 'kaihei') hx = 3;
							else hx = 4;
						}
						break;
					default:
						if (typeof get.config('choice_' + id) == 'number') hx = get.config('choice_' + id);
				}
				else hx = parseInt(lib.config.extension_胜负统计_wjs);
				_status.sftjlist.randomSort();
				for (let i = 0; i < _status.sftjlist.length; i++) {
					if (!lib.config.extension_胜负统计_wj.contains(_status.sftjlist[i])) list.push(_status.sftjlist[i]);
					if (list.length >= hx) break;
				}
				if (!list.length) {
					alert('没有可供候选的武将！');
					event.finish();
					return;
				}
				if ((player == game.zhu && (game.players.length > 4 || (game.players.length == 4 && sd == 'normal' && lib.config.extension_AI优化_fixFour))) || (id && (id == 'mingzhong' || id.indexOf('Zhu') > 0)) || player == game.friendZhu || player == game.enemyZhu) event.add = true;
				else event.add = false;
				if (player.name2 == undefined) str = '武将';
				else if (event.num) str = '副将';
				else str = '主将';
				if (lib.config.extension_胜负统计_delayWj != '0') game.delay(parseInt(lib.config.extension_胜负统计_delayWj));
				if (list.length == 1) event._result = {links: list};
				else player.chooseButton(true, ['请选择一张武将牌替换你的' + str, [list, 'character']]).ai = function (button) {
					return get.rank(button.link);
				};
				'step 2'
				let name = result.links[0],
					j = '将',
					old = player.name1;
				_status.sftjlist.remove(name);
				if (event.num) {
					j += '副将';
					old = player.name2;
					_status.sftjlist.push(player.name2);
					player.init(player.name1, name);
				} else {
					_status.sftjlist.push(player.name1);
					if (player.name2 != undefined) {
						j += '主将';
						player.init(name, player.name2);
					} else player.init(name);
				}
				if (event.add) {
					player.maxHp++;
					player.hp++;
				}
				if (!lib.character[name] || !lib.character[name][4] || !lib.character[name][4].contains('hiddenSkill')) player.showCharacter(event.num, false);
				game.log('#g'+get.cnNumber(player.getSeatNum()+1)+'号位', j, '#y' + (lib.translate[old]||'未知'), '更换为', '#y' + (lib.translate[name]||'未知'));
				'step 3'
				player.update();
				event.trigger('showCharacterEnd');
			}
		};
		lib.skill._sftj_fixWj = {//伪禁列表
			enable: 'phaseUse',
			filter: function (event, player) {
				return player == game.me && lib.config.extension_胜负统计_fixWj;
			},
			filterTarget: function (card, player, target) {
				if (target.name.indexOf('unknown')==0 && (target.name2 == undefined || target.name2.indexOf('unknown')==0)) return false;
				return true;
			},
			selectTarget: [0, Infinity],
			multitarget: true,
			multiline: true,
			prompt: '若选择角色则对这些角色的武将牌进行加入/移出伪禁列表操作，否则从所有武将包选择进行操作',
			log: false,
			charlotte: true,
			superCharlotte: true,
			content: function () {
				'step 0'
				targets.sortBySeat();
				if (targets.length) {
					event.names = [];
					for (let i of targets) {
						if (i.name.indexOf('unknown')) event.names.push(i.name);
						if (i.name2 != undefined && i.name2.indexOf('unknown')) event.names.push(i.name2);
					}
					event.goto(2);
				} else {
					let ts = [];
					event.sorts = [];
					for (let i in lib.characterPack) {
						if (Object.prototype.toString.call(lib.characterPack[i]) === '[object Object]') {
							event.sorts.push(lib.characterPack[i]);
							ts.push(lib.translate[i + '_character_config']);
						}
					}
					if (!ts.length) event.finish();
					else {
						event.videoId = lib.status.videoId++;
						let func = function (player, list, id) {
							let choiceList = ui.create.dialog('请选择要移动的武将所在的武将包');
							choiceList.videoId = id;
							for (let i = 0; i < list.length; i++) {
								let str = '<div class="popup text" style="width:calc(100% - 10px);display:inline-block">' + list[i] + '</div>';
								let next = choiceList.add(str);
								next.firstChild.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', ui.click.button);
								next.firstChild.link = i;
								for (let j in lib.element.button) {
									next[j] = lib.element.button[j];
								}
								choiceList.buttons.add(next.firstChild);
							}
							return choiceList;
						};
						if (game.me.isOnline2()) game.me.send(func, game.me, ts, event.videoId);
						event.dialog = func(game.me, ts, event.videoId);
						if (_status.auto) event.dialog.style.display = 'none';
						let next = game.me.chooseButton();
						next.set('dialog', event.videoId);
						next.set('forced', true);
						next.set('ai', function (button) {
							return 1;
						});
						next.set('selectButton', [0, ts.length]);
					}
				}
				'step 1'
				if (game.me.isOnline2()) game.me.send('closeDialog', event.videoId);
				event.dialog.close();
				if (result.links && result.links.length) {
					let nums = result.links.sort();
					event.names = [];
					for (let num of nums) {
						for (let i in event.sorts[num]) {
							event.names.push(i);
						}
					}
					if (!event.names.length) {
						alert('所选武将包不包含武将');
						event.finish();
					}
				} else event.finish();
				'step 2'
				event.jr = [];
				event.yc = [];
				for (let i of event.names) {
					if (lib.config.extension_胜负统计_wj.contains(i)) event.yc.push(i);
					else event.jr.push(i);
				}
				if (event.jr.length) player.chooseButton(['请选择要加入伪禁列表的武将，直接点“确定”则全部加入', [event.jr, 'character']], [0, Infinity]).ai = function (button) {
					return 0;
				};
				else event.goto(4);
				'step 3'
				if (result.bool){
					if(result.links&&result.links.length) lib.config.extension_胜负统计_wj.addArray(result.links);
					else lib.config.extension_胜负统计_wj.addArray(event.jr);
					game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_胜负统计_wj);
				}
				'step 4'
				if (event.yc.length) player.chooseButton(['请选择要移出伪禁列表的武将,直接点“确定”则全部移出', [event.yc, 'character']], [0, Infinity]).ai = function (button) {
					return 0;
				};
				else event.finish();
				'step 5'
				if (result.bool) {
					if(result.links&&result.links.length) lib.config.extension_胜负统计_wj.removeArray(result.links);
					else lib.config.extension_胜负统计_wj.removeArray(event.yc);
					game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_胜负统计_wj);
				}
			},
			ai: {
				result: {
					target: 0
				}
			}
		};
		lib.translate._sftj_fixWj = '<font color=#00FFFF>伪禁</font>';
	},
	precontent:function(){
		lib.get.statusModeInfo=function(sf){
			//获取当前游戏模式名称
			let info=lib.translate[get.mode()];
			if(_status.mode&&(!sf||lib.config.extension_胜负统计_apart)){
				let sm;
				switch(get.mode()){
					case 'identity':
						if(_status.mode=='normal') sm='标准';
						else if(_status.mode=='zhong') sm='明忠';
						else if(_status.mode=='purple') sm='3v3v2';
						break;
					case 'guozhan':
						if(_status.mode=='normal') sm='势备';
						else if(_status.mode=='yingbian') sm='应变';
						else if(_status.mode=='old') sm='怀旧';
						else if(_status.mode=='free') sm='自由';
						break;
					case 'versus':
						if(_status.mode=='four') sm='对抗';
						else if(_status.mode=='three') sm='统率';
						else if(_status.mode=='two') sm='欢乐';
						else if(_status.mode=='guandu') sm='官渡';
						else if(_status.mode=='jiange') sm='剑阁';
						else if(_status.mode=='siguo') sm='四国';
						else if(_status.mode=='standard') sm='自由';
						break;
					case 'doudizhu':
						if(_status.mode=='normal') sm='休闲';
						else if(_status.mode=='kaihei') sm='开黑';
						else if(_status.mode=='huanle') sm='欢乐';
						else if(_status.mode=='binglin') sm='兵临';
						else if(_status.mode=='online') sm='智斗';
						break;
					case 'single':
						lib.translate[_status.mode+'2'];
						break;
					case 'chess':
						if(_status.mode=='combat') sm='自由';
						else if(_status.mode=='three') sm='统率';
						else if(_status.mode=='leader') sm='君主';
						break;
				}
				if(sm) info+=' - '+sm;
			}
			return info+'模式';
		};
		lib.get.sfConfigName=function(identity){
			/*获取当前游戏模式下武将的胜负统计配置名
			参数：身份
			有身份 返回当前游戏模式胜负统计对应身份配置名（字符串）
			无身份 返回所有可能的身份配置名（数组）
			*/
			let mode=get.mode(),cgn='extension_胜负统计_'+mode,sm='';
			if(_status.mode&&lib.config.extension_胜负统计_apart&&_status.mode!='deck') sm='_'+_status.mode;
			if(typeof identity!='string'){
				if(mode=='identity'){
					if(_status.mode=='purple') return [cgn+sm+'_rZhu',cgn+sm+'_rZhong',cgn+sm+'_rNei',cgn+sm+'_rYe'];
					let configs=[];
					configs.addArray([cgn+sm+'_zhu',cgn+sm+'_zhong',cgn+sm+'_fan',cgn+sm+'_nei']);
					if(_status.mode=='zhong') configs.push(cgn+sm+'_mingzhong');
					return configs;
				}
				if(mode=='doudizhu'||mode=='single') return [cgn+sm+'_zhu',cgn+sm+'_fan'];
				return [cgn+sm];
			}
			if(mode=='identity'&&_status.mode=='purple') return cgn+sm+'_r'+identity.slice(1);
			if(mode=='identity'||mode=='doudizhu'||mode=='single') return cgn+sm+'_'+identity;
			return cgn+sm;
		};
		lib.get.purifySFConfig=function(config,min){//筛选至少min场的胜负记录
			if(Object.prototype.toString.call(config)!=='[object Object]') return config;
			if(typeof min!='number'||isNaN(min)) min=0;
			let result={},judge=false;
			for(let i in config){
				if(!judge){
					if(Object.prototype.toString.call(config[i])!=='[object Object]') return config;
					judge=true;
				}
				if(config[i].win+config[i].lose>=min) result[i]=config[i];
			}
			return result;
		};
		lib.get.identityInfo=function(str,none){
			/*获取字符串中最后一个'_'后面的身份翻译
			参数：待清洗字符串 不存在返回指定内容
			*/
			let res='';
			if(none) res=none;
			if(typeof str!='string') return res;
			let clean=str.split('_');
			if(get.sfConfigName().length<=1) return res;
			clean=clean[clean.length-1];
			if(clean.indexOf('unknown')==0) return res||'未知';
			if(isNaN(parseInt(clean[clean.length-1]))) clean+='2';
			let trans=lib.translate[clean];
			if(typeof trans!='string') return res;
			return trans;
		};
		lib.get.SL=function(name,identity,strategy){
			/*获取当前游戏模式下name的胜率
			参数：角色/武将id 身份 方案
			第一个参数为要获取胜率的目标
			identity为字符串，返回name对应身份胜率
			identity不为字符串，返回当前身份对应胜率。注意！武将id不存在副将和当前身份一说，很可能会返回默认值
			若identity为"all"，则改为返回name所有可能的身份胜率（身份作为键的字典）
			strategy为数字，没有对应胜率则取该值
			strategy为"avg"，获取主将和副将胜率的平均值，无副将或没有对应胜率则按0.5计算取平均
			strategy为"max"，获取主将和副将中胜率较高的，无副将或没有对应胜率则取1
			strategy为"min"，获取主将和副将中胜率较低的，无副将或没有对应胜率则取0
			strategy其他情况，直接返回主将胜率，无则返回0.5
			不存在的情况均返回默认值
			*/
			let cgns,name1='unknown',name2,result={};
			if(typeof identity!='string'){
				if(get.itemtype(name)=='player') identity=name.identity;
				else identity='undefined';
			}
			if(identity=='all') cgns=get.sfConfigName();
			else cgns=[get.sfConfigName(identity)];
			if(get.itemtype(name)=='player'){
				if(typeof name.name1=='string') name1=name.name1;
				if(typeof name.name2=='string') name2=name.name2;
			}
			else if(typeof name=='string') name1=name;
			let num1=0.5,num2=-1;
			if(typeof strategy=='number') num2=strategy;
			else if(strategy=='avg') num2=0.5;
			else if(strategy=='max') num1=num2=1;
			else if(strategy=='min') num1=num2=0;
			for(let cgn of cgns){
				let zhu,fu=num2;
				if(lib.config[cgn]&&lib.config[cgn][name1]) zhu=lib.config[cgn][name1].sl;
				if(lib.config[cgn]&&lib.config[cgn][name2]) fu=lib.config[cgn][name2].sl;
				if(typeof zhu!='number'){
					if(typeof strategy=='number') zhu=num2;
					else zhu=num1;
				}
				if(strategy=='avg') zhu=(zhu+fu)/2;
				else if(strategy=='max') zhu=Math.max(zhu,fu);
				else if(strategy=='min') zhu=Math.min(zhu,fu);
				if(identity=='all') result[get.identityInfo(cgn,'不明身份')]=zhu;
				else return zhu;
			}
			return result;
		};
		lib.get.sfInit=function(sf,now){//初始化
			let cgn;
			if(typeof sf!='string') cgn=get.sfConfigName();
			else cgn=[sf];
			for(let sf of cgn){
				if(Object.prototype.toString.call(lib.config[sf])!=='[object Object]') lib.config[sf]={};
				for(let i in lib.config[sf]){
					let all=lib.config[sf][i].win+lib.config[sf][i].lose;
					if(all) lib.config[sf][i].sl=lib.config[sf][i].win/all;
					else{
						delete lib.config[sf][i];
						continue;
					}
					if(!now&&lib.config.extension_胜负统计_display!='off'){
						if(lib.characterTitle[i]==undefined) lib.characterTitle[i]='';
						else lib.characterTitle[i]+='<br>';
						lib.characterTitle[i]+=get.identityInfo(sf)+'<br>';
						if(lib.config.extension_胜负统计_display!='sf') lib.characterTitle[i]+='总场数：'+all+' 胜率：'+Math.round(10000*lib.config[sf][i].sl)/100+'%<br>';
						if(lib.config.extension_胜负统计_display!='sl') lib.characterTitle[i]+=lib.config[sf][i].win+'胜 '+lib.config[sf][i].lose+'负<br>';
					}
				}
				game.saveConfig(sf,lib.config[sf]);
			}
		};
		lib.arenaReady.push(function(){
			if(!Array.isArray(lib.config.extension_胜负统计_wj)){
				if(Array.isArray(lib.config.extension_AI优化_wj&&lib.config.extension_AI优化_wj.length)){
					game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_AI优化_wj);
					alert('已成功载入AI优化中对应伪禁列表配置');
				}
				else if(Array.isArray(lib.config.extension_官将重修_wj&&lib.config.extension_官将重修_wj.length)){
					game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_官将重修_wj);
					alert('已成功载入官将重修中对应伪禁列表配置');
				}
				else game.saveExtensionConfig('胜负统计', 'wj', []);
			}
			if(!lib.config.extension_胜负统计_apart) get.sfInit();
			lib.onover.push(function(result){
				if(!lib.config.extension_胜负统计_record) return;
				let curs = game.filterPlayer2(true, null, true),
				wins = [],
				can = true,
				id = [],
				mode = get.mode();
				if (mode == 'identity') {
					if (_status.mode == 'purple') {
						if (result || lib.config.extension_胜负统计_sw) id = game.me.identity;
						else if (game.hasPlayer(function (current) {
							if (current.identity.indexOf('Zhu') == 1){
								id = current.identity;
								return true;
							}
							return false;
						}));
						else if (!game.hasPlayer(function (current) {
							return current.identity.indexOf('Ye') != 1;
						})) id = 'rYe';
						else id = 'none';
						switch (id) {
							case 'rZhu':
							case 'rZhong':
							case 'bNei':
								wins = game.filterPlayer2(function (target) {
									return ['rZhu', 'rZhong', 'bNei'].contains(target.identity);
								}, null, true);
								break;
							case 'bZhu':
							case 'bZhong':
							case 'rNei':
								wins = game.filterPlayer2(function (target) {
									return ['bZhu', 'bZhong', 'rNei'].contains(target.identity);
								}, null, true);
								break;
							case 'rYe':
							case 'bYe':
								wins = game.filterPlayer2(function (target) {
									return ['rYe', 'bYe'].contains(target.identity);
								}, null, true);
								break;
						}
					}
					else {
						if (result || lib.config.extension_胜负统计_sw) id = game.me.identity;
						else if (game.players.length == 1) id = game.players[0].identity;
						else if (game.zhu.isDead()) id = 'fan';
						else id = 'zhu';
						switch (id) {
							case 'fan':
								wins = game.filterPlayer2(function (target) {
									return target.identity == 'fan';
								}, null, true);
								break;
							case 'nei':
								wins = game.players;
								break;
							default:
								wins = game.filterPlayer2(function (target) {
									return ['zhu', 'zhong', 'mingzhong'].contains(target.identity);
								}, null, true);
						}
					}
				}
				else if (mode == 'guozhan') {
					if (result || lib.config.extension_胜负统计_sw) {
						if (game.me.identity == 'ye') wins = [game.me];
						else {
							id = lib.character[game.me.name1][1];
							wins = game.filterPlayer2(function (target) {
								return target.identity != 'ye' && lib.character[target.name1][1] == id;
							}, null, true);
						}
					}
					else if (game.countPlayer(function (current) {
						if (current.identity == 'ye') return true;
						let g = lib.character[current.name1][1];
						if (!id.contains(g)) {
							id.add(g);
							return true;
						}
						return false;
					}) > 1) can = false;
					else if (game.players[0].identity == 'ye') wins = game.players;
					else {
						id = lib.character[game.players[0].name1][1];
						wins = game.filterPlayer2(function (target) {
							return target.identity != 'ye' && lib.character[target.name1][1] == id;
						}, null, true);
					}
				}
				else if (mode == 'doudizhu' || mode == 'single' || mode == 'boss') {
					if (game.zhu&&game.zhu.isDead()||game.boss&&game.boss.isDead()) wins = game.filterPlayer2(function (target){
						return target.identity != 'zhu' && target.identity != 'zhong';
					}, null, true);
					else wins = game.filterPlayer2(function (target) {
						return target.identity == 'zhu' || target.identity == 'zhong';
					}, null, true);
				}
				else {
					if (result || lib.config.extension_胜负统计_sw) wins = game.filterPlayer2(function (target) {
						return target.side == game.me.side;
					}, null, true);
					else if (game.countPlayer(function (current) {
						for (let s of id) {
							if (s.side == current.side) return false;
						}
						id.add(current);
						return true;
					}) > 1) can = false;
					else wins = game.filterPlayer2(function (target) {
						return target.side == game.players[0].side;
					}, null, true);
				}
				for (let i of curs) {
					if ((!can || !lib.config.extension_胜负统计_tryAll) && game.me != i || mode == 'boss' && i.identity == 'zhong') continue;
					let bool;
					if (lib.config.extension_胜负统计_sw) {
						if (wins.contains(i)) bool = result;
						else bool = !result;
					}
					else if (wins.contains(i)) bool = true;
					else bool = false;
					let cgn = get.sfConfigName(i.identity||'unknown'), names=[];
					if(i.storage.sftj&&i.name1!=i.storage.sftj.cg1){
						if(lib.config.extension_胜负统计_change=='pre'&&i.storage.sftj.cg1!=undefined) names.push(i.storage.sftj.cg1);
						else if(lib.config.extension_胜负统计_change=='nxt'&&i.name1!=undefined) names.push(i.name1);
					}
					else if(i.name1!=undefined) names.push(i.name1);
					if(i.storage.sftj&&i.name2!=i.storage.sftj.cg2){
						if(lib.config.extension_胜负统计_change=='pre'&&i.storage.sftj.cg2!=undefined) names.push(i.storage.sftj.cg2);
						else if(lib.config.extension_胜负统计_change=='nxt'&&i.name2!=undefined) names.push(i.name2);
					}
					else if(i.name2!=undefined) names.push(i.name2);
					for(let j of names){
						if (lib.config[cgn][j] == undefined) lib.config[cgn][j] = {win: 0, lose: 0};
						if (bool == true) lib.config[cgn][j].win++;
						else lib.config[cgn][j].lose++;
					}
				}
				for(let i of get.sfConfigName()){
					game.saveConfig(i, lib.config[i]);
				}
			});
		});
	},
	config:{
		apart: {
			name: '<span style="font-family: xingkai">区分当前游戏模式</font>',
			intro: '开启后，武将胜负统计将<font color=#FF0000>区分开当前游戏模式</font>（即按照菜单->开始->模式->游戏模式分开统计）',
			init: true,
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','apart',item);
				if(!lib.config.extension_胜负统计_apart_alerted){
					game.saveExtensionConfig('胜负统计','apart_alerted',true);
					alert('为避免调整此配置后继续使用本扩展功能可能带来的冲突，将自动重启游戏');
				}
				game.reload();
			}
		},
		display: {
			name: '<span style="font-family: xinwei">胜负场数相关显示</span>',
			intro: '调整武将信息上方的胜率、胜负场数相关显示',
			init: 'all',
			item: {
				all: '都显示',
				sf: '显示胜负场数',
				sl: '显示胜率',
				off: '不显示'
			},
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','display',item);
			}
		},
		record: {
			name: '<span style="font-family: xingkai">武将胜负记录</span>',
			intro: '开启后，游戏结束将根据玩家胜负记录玩家所使用的武将胜负',
			init: true,
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','record',item);
			}
		},
		tryAll: {
			name: '<span style="font-family: xingkai">尝试记录全场武将</span>',
			intro: '开启后，游戏结束将记录根据玩家胜负可以推测出来胜负的角色所使用的武将胜负',
			init: false,
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','tryAll',item);
			}
		},
		sw: {
			name: '<span style="font-family: xingkai">其他阵营视为同一阵营</span>',
			intro: '开启后，游戏结束进行记录时其他阵营将视为同一阵营，即玩家方赢、其余方均输，玩家方没赢，其余方均赢',
			init: false,
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','sw',item);
			}
		},
		change: {
			name: '<span style="font-family: xingkai">更换武将角色</font>',
			intro: '如果一个角色在游戏结束时用的武将和游戏开始时不同，可以选择记录游戏开始时的（最初的）或者记录游戏结束时的（最后的）',
			init: 'off',
			item: {
				off: '不记录',
				pre: '记录最初的',
				nxt: '记录最后的'
			},
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','change',item);
			}
		},
		operateJl: {
			name: '<span style="font-family: xingkai">出牌阶段可修改胜负记录</font>',
			intro: '开启后，出牌阶段可以对场上武将或所有武将当前游戏模式的胜负记录进行批量删除或修改操作',
			init: false,
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','operateJl',item);
			}
		},
		slRank: {
			name: '当前模式胜率排行榜',
			clear: true,
			onclick: function () {
				let mode=get.statusModeInfo(true),cgn=get.sfConfigName(),num=0;
				for(let i of cgn){
					get.sfInit(i,true);
					let rankNum = parseInt(lib.config.extension_胜负统计_rankNum), sortedKeys = Object.entries(get.purifySFConfig(lib.config[i], parseInt(lib.config.extension_胜负统计_min))).sort(function(a, b){
						let res = Math.round(100000*a[1].sl) - Math.round(100000*b[1].sl);
						if(rankNum>0) res = -res;
						if(res==0) return b[1].win+b[1].lose-a[1].win-a[1].lose;
						return res;
					}).slice(0, Math.abs(rankNum)).map(entry => entry[0]);
					if(!sortedKeys.length) continue;
					let txt=mode+'武将'+get.identityInfo(i)+'胜率排行榜（'+(rankNum>0?'正序':'倒序')+'）';
					for(let j=0;j<sortedKeys.length;j++){
						txt+='\n   第'+(j+1)+'名   '+(lib.translate[sortedKeys[j]]||'未知')+'|'+sortedKeys[j]+'\n                     '+lib.config[i][sortedKeys[j]].win+'胜'+lib.config[i][sortedKeys[j]].lose+'负      胜率：'+Math.round(100000*lib.config[i][sortedKeys[j]].sl)/1000+'%';
					}
					num++;
					alert(txt);
				}
				if(!num) alert('当前模式暂无符合条件的记录');
			}
		},
		rankNum: {
			name: '<span style="font-family: xingkai">排行榜展示</font>：',
			intro: '和选项连起来读',
			init: '10',
			item: {
				'10': '前十名',
				'5': '前五名',
				'15': '前十五名',
				'20': '前二十名',
				'50': '前五十名',
				'-10': '最后十名',
				'-5': '最后五名',
				'-15': '最后十五名',
				'-20': '最后二十名',
				'-50': '最后五十名',
			},
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','rankNum',item);
			}
		},
		min: {
			name: '<span style="font-family: xingkai">只筛选总场数：</font>',
			intro: '在展示当前游戏模式武将胜率排行榜时，只在符合本配置条件的记录中筛选',
			init: '10',
			item: {
				'3': '不少于3局的',
				'5': '不少于5局的',
				'7': '不少于7局的',
				'10': '不少于10局的',
				'20': '不少于20局的',
				'30': '不少于30局的',
				'50': '不少于50局的',
				'0': '不少于0局的',
			},
			onclick: function (item) {
				game.saveExtensionConfig('胜负统计','min',item);
			}
		},
		loadJl:{
			name:"载入当前模式武将胜负记录",
			clear:true,
			onclick:function(){
				let container=ui.create.div('.popup-container.editor');
				let editorpage=ui.create.div(container);
				let discardConfig=ui.create.div('.editbutton','取消',editorpage,function(){
					ui.window.classList.remove('shortcutpaused');
					ui.window.classList.remove('systempaused');
					container.delete(null);
					delete window.saveNonameInput;
				});
				let node=container;
				let map=get.sfConfigName();
				let str='';
				for(let i of map){
					str+='_status.'+i+' = {\r	//请在此大括号内填写'+get.statusModeInfo(true)+'你想载入的武将'+get.identityInfo(i)+'胜负记录\r};\r';
				}
				str+='//请在{}内进行编辑，务必使用英文标点符号！';
				node.code=str;
				ui.window.classList.add('shortcutpaused');
				ui.window.classList.add('systempaused');
				let saveInput=function(){
					let code;
					if(container.editor) code=container.editor.getValue();
					else if(container.textarea) code=container.textarea.value;
					try{
						eval(code);
						for(let i of map){
							if(_status[i]&&Object.prototype.toString.call(_status[i])!=='[object Object]') throw('typeError');
						}
					}
					catch(e){
						if(e==='typeError') alert('类型错误');
						else alert('代码语法有错误，请仔细检查（'+e+'）');
						return;
					}
					for(let i of map){
						if(_status[i]) for(let name in _status[i]){
							lib.config[i][name] = _status[i][name];
							if(!lib.config[i][name].win) lib.config[i][name].win=0;
							if(!lib.config[i][name].lose) lib.config[i][name].lose=0;
							let all=lib.config[i][name].win+lib.config[i][name].lose;
							if(all) lib.config[i][name].sl=lib.config[i][name].win/all;
							else delete lib.config[i][name];
						}
						game.saveConfig(i,lib.config[i]);
					}
					ui.window.classList.remove('shortcutpaused');
					ui.window.classList.remove('systempaused');
					container.delete();
					container.code=code;
					delete window.saveNonameInput;
				};
				window.saveNonameInput=saveInput;
				let saveConfig=ui.create.div('.editbutton','保存',editorpage,saveInput);
				let editor=ui.create.div(editorpage);
				if(node.aced){
					ui.window.appendChild(node);
					node.editor.setValue(node.code,1);
				}
				else if(lib.device=='ios'){
					ui.window.appendChild(node);
					if(!node.textarea){
						let textarea=document.createElement('textarea');
						editor.appendChild(textarea);
						node.textarea=textarea;
						lib.setScroll(textarea);
					}
					node.textarea.value=node.code;
				}
				else{
					let aceReady=function(){
						ui.window.appendChild(node);
						let mirror=window.CodeMirror(editor,{
							value:node.code,
							mode:"javascript",
							lineWrapping:!lib.config.touchscreen&&lib.config.mousewheel,
							lineNumbers:true,
							indentUnit:4,
							autoCloseBrackets:true,
							theme:'mdn-like'
						});
						lib.setScroll(editor.querySelector('.CodeMirror-scroll'));
						node.aced=true;
						node.editor=mirror;
					}
					if(!window.ace){
						lib.init.js(lib.assetURL+'game','codemirror',aceReady);
						lib.init.css(lib.assetURL+'layout/default','codemirror');
					}
					else aceReady();
				}
			}
		},
		copyJl: {
			name: '复制当前模式武将胜负记录',
			clear: true,
			onclick: function () {
				let cgn=get.sfConfigName();
				let mode=get.statusModeInfo(true)+'所有武将';
				let copy='', show=true;
				for(let i of cgn){
					show=true;
					if(!confirm(copy+'是否复制'+mode+get.identityInfo(i)+'胜负记录？')){
						copy='';
						continue;
					}
					let map = lib.config[i] || {}, txt = '	//'+mode+get.identityInfo(i)+'胜负记录\r';
					get.sfInit(i,true);
					for (let name in map) {
						txt += '\r	"' + name + '":{\r		win: ' + map[name].win + ',\r		lose: ' + map[name].lose + ',\r	},';
					}
					let textarea = document.createElement('textarea');
					textarea.setAttribute('readonly', 'readonly');
					textarea.value = txt;
					document.body.appendChild(textarea);
					textarea.select();
					if (document.execCommand('copy')) {
						document.execCommand('copy');
						copy = mode+get.identityInfo(i)+'胜负记录已成功复制到剪切板，建议您先粘贴到其他地方再进行后续操作。\n';
					}
					else copy = mode+get.identityInfo(i)+'胜负记录复制失败。\n';
					document.body.removeChild(textarea);
					show=false;
				}
				if(!show){
					if(copy.includes('失败')) alert(copy.split('。')[0]);
					else alert(copy.split('，')[0]);
				}
			}
		},
		deleteJl: {
			name: '删除当前模式武将胜负记录',
			clear: true,
			onclick: function () {
				let mode=get.statusModeInfo(true),cgn=get.sfConfigName();
				if(cgn.length>1){
					let num=0;
					for(let i of cgn){
						if(confirm('您确定要清空'+mode+'所有武将'+get.identityInfo(i)+'胜负记录吗？')){
							num++;
							game.saveConfig(i,{});
						}
					}
					if(num) alert('成功清除'+num+'项');
				}
				else if(confirm('您确定要清空'+lib.translate[get.mode()]+'模式'+mode+'所有武将的胜负记录吗？')){
					game.saveConfig(cgn[0],{});
					alert('清除成功');
				}
			}
		},
		bd1: {
			clear: true,
			name: '<center>武将去重相关</center>'
		},
		qc: {
			name: '武将登场去重',
			intro: '开启后，游戏开始或隐匿武将展示武将牌时，若场上有拼音id重复的武将，则令其中随机一名角色再次进行选将并重复此流程。',
			init: false
		},
		tip1: {
			name: '<font color=#FF3300>注意！</font>此功能进行的选将<font color=#FFFF00>不再额外提供固定武将</font>，且<font color=#FFFF00>暂不支持为特殊模式提供专属将池</font>',
			clear: true
		},
		qcs: {
			name: '去重候选武将数',
			intro: '〔默认〕即游戏开始时每名角色的候选武将数，若为自由选将等特殊情况则默认为6',
			init: 'same',
			item: {
				same: '默认',
				1: '一',
				2: '二',
				3: '三',
				4: '四',
				5: '五',
				6: '六',
				8: '八',
				10: '十'
			}
		},
		delayQc: {
			name: '去重换将延时',
			intro: '作者为展示效果用',
			init: '0',
			item: {
				0: '不延时',
				1: '1秒',
				2: '2秒',
				3: '3秒',
				5: '5秒'
			}
		},
		qcp: {
			name: '玩家去重时',
			intro: '玩家为重复武将其中一方被选中更换武将时，〔人机先执行〕优先令另一方更换武将，若另一方受情景约束不能更换武将，玩家不受此约束，则要求玩家更换武将；〔始终不执行〕优先令另一方更换武将，若另一方受情景约束不能更换武将，则不再对这组进行去重操作',
			init: 'ai',
			item: {
				zc: '直接执行',
				ai: '人机先执行',
				no: '始终不执行'
			}
		},
		bd2: {
			clear: true,
			name: '<center>伪禁相关</center>'
		},
		Wj: {
			name: '<font color=#00FFFF>伪</font>玩家可选ai禁选',
			intro: '开启后，游戏开始或隐匿武将展示武将牌时，若场上有ai选择了伪禁列表里包含的ID对应武将，则<font color=#FFFF00>勒令其</font>从未加入游戏且不包含伪禁列表武将的将池里<font color=#FFFF00>再次</font>进行<font color=#FFFF00>选将</font>',
			init: false
		},
		wjs: {
			name: '伪禁候选武将数',
			intro: '〔默认〕即游戏开始时每名角色的候选武将数，若为自由选将等特殊情况则默认为6',
			init: 'same',
			item: {
				same: '默认',
				1: '一',
				2: '二',
				3: '三',
				4: '四',
				5: '五',
				6: '六',
				8: '八',
				10: '十'
			}
		},
		delayWj: {
			name: '伪禁换将延时',
			intro: '作者为展示效果用',
			init: '0',
			item: {
				0: '不延时',
				1: '1秒',
				2: '2秒',
				3: '3秒',
				5: '5秒'
			}
		},
		fixWj: {
			name: '出牌阶段可编辑伪禁',
			intro: '出牌阶段可将场上武将加入/移出伪禁列表，也可以从若干个武将包中选择武将执行此操作',
			init: false
		},
		editWj: {
			name: '编辑伪禁列表',
			clear: true,
			onclick: function () {
				//代码取自［编辑统率将池］
				let container = ui.create.div('.popup-container.editor');
				let editorpage = ui.create.div(container);
				let discardConfig = ui.create.div('.editbutton', '取消', editorpage, function () {
					ui.window.classList.remove('shortcutpaused');
					ui.window.classList.remove('systempaused');
					container.delete(null);
					delete window.saveNonameInput;
				});
				let node = container;
				let map = lib.config.extension_胜负统计_wj || [];
				let str = 'disabled=[';
				for (let i = 0; i < map.length; i++) {
					str += '\n	"' + map[i] + '",';
				}
				str += '\n];\n//请在[]内进行编辑，或借此复制/粘贴内容以备份/还原配置\n//请务必使用英文标点符号！';
				node.code = str;
				ui.window.classList.add('shortcutpaused');
				ui.window.classList.add('systempaused');
				let saveInput = function () {
					let code;
					if (container.editor) code = container.editor.getValue();
					else if (container.textarea) code = container.textarea.value;
					try {
						var disabled = null;
						eval(code);
						if (!Array.isArray(disabled)) {
							throw '类型不符';
						}
					} catch (e) {
						if (e == '类型不符') alert(e);
						else alert('代码语法有错误，请仔细检查（' + e + '）');
						return;
					}
					game.saveExtensionConfig('胜负统计', 'wj', disabled);
					ui.window.classList.remove('shortcutpaused');
					ui.window.classList.remove('systempaused');
					container.delete();
					container.code = code;
					delete window.saveNonameInput;
				};
				window.saveNonameInput = saveInput;
				let saveConfig = ui.create.div('.editbutton', '保存', editorpage, saveInput);
				let editor = ui.create.div(editorpage);
				if (node.aced) {
					ui.window.appendChild(node);
					node.editor.setValue(node.code, 1);
				} else if (lib.device == 'ios') {
					ui.window.appendChild(node);
					if (!node.textarea) {
						let textarea = document.createElement('textarea');
						editor.appendChild(textarea);
						node.textarea = textarea;
						lib.setScroll(textarea);
					}
					node.textarea.value = node.code;
				} else {
					let aceReady = function () {
						ui.window.appendChild(node);
						let mirror = window.CodeMirror(editor, {
							value: node.code,
							mode: 'javascript',
							lineWrapping: !lib.config.touchscreen && lib.config.mousewheel,
							lineNumbers: true,
							indentUnit: 4,
							autoCloseBrackets: true,
							theme: 'mdn-like'
						});
						lib.setScroll(editor.querySelector('.CodeMirror-scroll'));
						node.aced = true;
						node.editor = mirror;
					};
					if (!window.ace) {
						lib.init.js(lib.assetURL + 'game', 'codemirror', aceReady);
						lib.init.css(lib.assetURL + 'layout/default', 'codemirror');
					} else aceReady();
				}
			}
		},
		copyWj: {
			name: '一键复制伪禁列表',
			clear: true,
			onclick: function () {
				let map = lib.config.extension_胜负统计_wj || [];
				let txt = '';
				for (let i = 0; i < map.length; i++) {
					txt += '\r	"' + map[i] + '",';
				}
				const textarea = document.createElement('textarea');
				textarea.setAttribute('readonly', 'readonly');
				textarea.value = txt;
				document.body.appendChild(textarea);
				textarea.select();
				if (document.execCommand('copy')) {
					document.execCommand('copy');
					alert('伪禁列表已成功复制到剪切板');
				} else alert('复制失败');
				document.body.removeChild(textarea);
			}
		},
		clearWj: {
			name: '清空伪禁列表',
			clear: true,
			onclick: function () {
				if (confirm('您确定要清空伪玩家可选ai禁选列表（共' + lib.config.extension_胜负统计_wj.length + '个伪禁武将）？')) {
					game.saveExtensionConfig('胜负统计', 'wj', []);
					alert('清除成功');
				}
			}
		},
		bd3: {
			name: '<hr>',
			clear: true
		},
	},
	help:{},
	package:{
		character:{
			character:{},
			translate:{},
		},
		card:{
			card:{},
			translate:{},
			list:[],
		},
		skill:{
			skill:{},
			translate:{},
		},
		intro:'<b><font color=#FFFF00>此版本为 武将去重&伪禁功能 定制版本</font>（基于可载入记录版修改）</b><br><br><font color=#FF3300>注意：本扩展</font>内，<br>◆以下<span style="font-family: xinwei">魏体</span>选项均<font color=#70F3FF>重启后生效</font>！其余选项<font color=#FF3300>即时生效</font><br>◆<font color=#70F3FF>长按选项</font>有提示',
		author:'157',
		diskURL:'',
		forumURL:'',
		version:'1.0',
	},
	files:{'character':[],'card':[],'skill':[]}
}})