import { lib, game, ui, get, ai, _status } from './utils.js';

export function content(config, pack) {
	lib.skill._sftj_operateJl = { //胜负记录操作
		enable: 'phaseUse',
		filter(event, player) {
			return player === game.me && lib.config.extension_胜负统计_operateJl;
		},
		filterTarget(card, player, target) {
			if (target.name.indexOf('unknown') === 0 && (target.name2 === undefined || target.name2.indexOf('unknown') === 0)) return false;
			return true;
		},
		selectTarget: [0, Infinity],
		multitarget: true,
		prompt: '若选择角色则对这些角色的武将牌当前游戏模式的胜负记录进行操作，否则从所有武将包选择进行操作',
		log: false,
		charlotte: true,
		superCharlotte: true,
		content() {
			'step 0'
			targets.sortBySeat();
			if (targets.length) {
				event.names = [];
				for (let i of targets) {
					if (i.name.indexOf('unknown')) event.names.push(i.name);
					if (i.name2 !== undefined && i.name2.indexOf('unknown')) event.names.push(i.name2);
				}
				event.goto(4);
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
					let func = (player, list, id) => {
						let choiceList = ui.create.dialog('请选择要做记录操作的武将所在的武将包');
						choiceList.videoId = id;
						for (let i = 0; i < list.length; i++) {
							let str =
								'<div class="popup text" style="width:calc(100% - 10px);display:inline-block">' + list[i] + '</div>';
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
					next.set('ai', (button) => {
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
			player
				.chooseButton(['请选择要对当前游戏模式胜负记录进行操作的武将', [event.names, 'character']], [1, Infinity])
				.set('ai', (button) => {
					return 0;
				});
			'step 3'
			if (result.bool && result.links) event.names = result.links;
			else event.finish();
			'step 4'
			player
				.chooseControl(['修改', '删除', '取消'])
				.set('prompt', '请选择要对所选武将当前游戏模式胜负记录进行的操作')
				.set('ai', () => {
					return '取消';
				});
			'step 5'
			if (result.control === '取消') event.finish();
			else if (result.control === '删除') {
				let mode = get.currentModeInfo(true),
					cgn = get.sfConfigName(),
					num = 0;
				if (cgn.length > 1) {
					for (let i of cgn) {
						if (confirm('您确定要删除这' + event.names.length + '个武将' + mode + get.identityInfo(i) + '胜负记录吗？')) {
							for (let name of event.names) {
								if (lib.config[i][name]) {
									delete lib.config[i][name];
									num++;
								}
							}
							game.saveConfig(i, lib.config[i]);
						}
					}
					if (num) alert('成功清除' + num + '条胜负记录');
				} else if (
					confirm('您确定要删除这' + event.names.length + '个武将' + lib.translate[get.mode()] + '模式' + mode + '胜负记录吗？')
				) {
					for (let name of event.names) {
						if (lib.config[i][name]) {
							delete lib.config[cgn[0]][name];
							num++;
						}
					}
					game.saveConfig(cgn[0], {});
					if (num) alert('成功清除' + num + '条胜负记录');
				}
				event.finish();
			} else event.cgns = get.sfConfigName();
			'step 6'
			if (event.cgns.length > 1) {
				let trans = [];
				for (let i = 0; i < event.cgns.length; i++) {
					trans.push(get.identityInfo(event.cgns[i]));
				}
				trans.push('取消');
				player
					.chooseControl(trans)
					.set('prompt', '请选择要修改的胜负记录类型')
					.set('ai', () => {
						return '取消';
					});
			} else if (!event.cgns.length) event.finish();
			else event._result = { index: 0, control: get.identityInfo(event.cgns[0]) };
			'step 7'
			if (result.control === '取消') event.finish();
			else {
				event.cgn = event.cgns[result.index];
				event.num = 0;
			}
			'step 8'
			if (!lib.config[event.cgn][event.names[event.num]]) lib.config[event.cgn][event.names[event.num]] = { win: 0, lose: 0 };
			event.prese = lib.config[event.cgn][event.names[event.num]].win;
			'step 9'
			let as = ['+10'],
				sm = get.currentModeInfo(true);
			if (event.prese >= 10) as.push('-10');
			as.push('+1');
			if (event.prese) as.push('-1');
			as.push('确定修改');
			as.push('不修改');
			player
				.chooseControl(as)
				.set('prompt', '获胜场数：<font color=#00FFFF>' + event.prese + '</font>')
				.set(
					'prompt2',
					'<center>修改<font color=#FFFF00>' +
						(lib.translate[event.names[event.num]] || '未知') +
						'</font>' +
						sm +
						'<font color=#00FF00>' +
						get.identityInfo(event.cgn) +
						'</font>获胜场数记录</center><br><center>原获胜场数：<font color=#FF3300>' +
						lib.config[event.cgn][event.names[event.num]].win +
						'</font></center>'
				)
				.set('ai', () => {
					return '不修改';
				});
			'step 10'
			if (result.control === '确定修改') {
				lib.config[event.cgn][event.names[event.num]].win = event.prese;
				game.saveConfig(event.cgn, lib.config[event.cgn]);
			} else if (result.control === '不修改') {
				if (lib.config[event.cgn][event.names[event.num]].win + lib.config[event.cgn][event.names[event.num]].lose === 0)
					delete lib.config[event.cgn][event.names[event.num]];
			} else {
				if (result.control === '+1') event.prese++;
				else if (result.control === '-1') event.prese--;
				else if (result.control === '+10') event.prese += 10;
				else if (result.control === '-10') event.prese -= 10;
				event.goto(9);
			}
			'step 11'
			if (!lib.config[event.cgn][event.names[event.num]]) lib.config[event.cgn][event.names[event.num]] = { win: 0, lose: 0 };
			event.prese = lib.config[event.cgn][event.names[event.num]].lose;
			'step 12'
			let bs = ['+10'],
				sd = get.currentModeInfo(true);
			if (event.prese >= 10) bs.push('-10');
			bs.push('+1');
			if (event.prese) bs.push('-1');
			bs.push('确定修改');
			bs.push('不修改');
			player
				.chooseControl(bs)
				.set('prompt', '失败场数：<font color=#FF3300>' + event.prese + '</font>')
				.set(
					'prompt2',
					'<center>修改<font color=#FFFF00>' +
						(lib.translate[event.names[event.num]] || '未知') +
						'</font>' +
						sd +
						'<font color=#00FF00>' +
						get.identityInfo(event.cgn) +
						'</font>失败场数记录</center><br><center>原失败场数：<font color=#00FFFF>' +
						lib.config[event.cgn][event.names[event.num]].lose +
						'</font></center>'
				)
				.set('ai', () => {
					return '不修改';
				});
			'step 13'
			let abb = lib.config[event.cgn][event.names[event.num]].win;
			if (result.control === '确定修改') {
				if (abb + event.prese === 0) delete lib.config[event.cgn][event.names[event.num]];
				else {
					lib.config[event.cgn][event.names[event.num]].lose = event.prese;
					let all = abb + event.prese;
					if (all) lib.config[event.cgn][event.names[event.num]].sl = abb / all;
					else delete lib.config[event.cgn][event.names[event.num]];
				}
				game.saveConfig(event.cgn, lib.config[event.cgn]);
			} else if (result.control === '不修改') {
				if (abb + lib.config[event.cgn][event.names[event.num]].lose === 0) {
					delete lib.config[event.cgn][event.names[event.num]];
					game.saveConfig(event.cgn, lib.config[event.cgn]);
				}
			} else {
				if (result.control === '+1') event.prese++;
				else if (result.control === '-1') event.prese--;
				else if (result.control === '+10') event.prese += 10;
				else if (result.control === '-10') event.prese -= 10;
				event.goto(12);
			}
			'step 14'
			event.num++;
			if (event.num < event.names.length) event.goto(8);
			'step 15'
			event.cgns.remove(event.cgn);
			if (event.cgns.length) event.goto(6);
		},
		ai: {
			result: {
				target: 0,
			},
		},
	};
	lib.translate._sftj_operateJl = '<font color=#00FFFF>记录操作</font>';
	lib.skill._sftj_start = {
		trigger: { global: 'gameStart' },
		filter(event, player) {
			if (player === game.me) {
				game.countPlayer2((current) => {
					current.storage.sftj = {
						cg1: current.name1,
						cg2: current.name2,
					};
				});
				if (lib.config.extension_胜负统计_apart) return true;
			}
		},
		silent: true,
		priority: 157,
		charlotte: true,
		superCharlotte: true,
		content() {
			game.sfRefresh();
		},
	};
	lib.skill._sftj_remove_duplicate = { //同名去重
		trigger: { global: ['gameStart', 'showCharacterEnd'] },
		filter(event, player) {
			return lib.config.extension_胜负统计_qc && player === game.me;
		},
		silent: true,
		unique: true,
		priority: 729,
		charlotte: true,
		superCharlotte: true,
		content() {
			'step 0'
			if (!_status.sftjlist) {
				//未上场角色池
				let list = [];
				if (_status.connectMode) list = get.charactersOL();
				else
					for (let i in lib.character) {
						if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
						list.push(i);
					}
				game.countPlayer2((current) => {
					list.remove(current.name);
					list.remove(current.name1);
					list.remove(current.name2);
				});
				_status.sftjlist = list;
			}
			let names = [],
				currents = game.filterPlayer().randomSort(),
				info;
			event.target = null;
			event.add = false;
			if (!_status.sftj_qc) _status.sftj_qc = [];
			for (let i = 0; i < currents.length; i++) {
				for (let j = 1; j < 3; j++) {
					info = currents[i]['name' + j];
					if (typeof info !== 'string' || info.indexOf('unknown') === 0 || _status.sftj_qc.includes(info)) continue;
					let find = false;
					if (names.includes(info)) find = true;
					else
						for (let key of names) {
							let index = key.split('_');
							index = index[index.length - 1].split('');
							find = true;
							for (let check = info.length - 1; check >= 0; check--) {
								let com = index.pop();
								if (com !== info[check]) {
									find = false;
									break;
								}
								if (index.length === 0) {
									if (check > 0 && info[check - 1] !== '_') find = false;
									break;
								}
							}
							if (find) break;
						}
					if (find) {
						event.target = currents[i];
						event.num = j - 1;
						break;
					} else names.push(info);
				}
			}
			if (event.target) {
				let sd = _status.mode,
					name,
					qcp = lib.config.extension_胜负统计_qcp,
					curs;
				if (get.mode() === 'single' && sd === 'dianjiang') {
					if (!localStorage.getItem('gjcx_single_alerted')) {
						localStorage.setItem('gjcx_single_alerted', true);
						alert('当前模式为点将模式，不在［武将登场去重］功能管辖范围内');
					}
					event.finish();
					return;
				}
				if (event.num) name = event.target.name2;
				else name = event.target.name1;
				if (
					(game.me === event.target && qcp !== 'zc') ||
					event.target === game.boss ||
					(get.mode() === 'boss' && event.target.identity === 'zhong') ||
					event.target === game.trueZhu ||
					event.target === game.falseZhu
				) {
					curs = game.filterPlayer((current) => {
						if (
							current === game.boss ||
							(get.mode() === 'boss' && current.identity === 'zhong') ||
							current === game.trueZhu ||
							current === game.falseZhu
						)
							return false;
						for (let j = 1; j < 3; j++) {
							info = current['name' + j];
							if (typeof info !== 'string' || info.indexOf('unknown') === 0) continue;
							let find = false;
							if (name === info) find = true;
							else {
								let index = name.split('_');
								index = index[index.length - 1].split('');
								find = true;
								for (let check = info.length - 1; check >= 0; check--) {
									let com = index.pop();
									if (com !== info[check]) {
										find = false;
										break;
									}
									if (index.length === 0) {
										if (check > 0 && info[check - 1] !== '_') find = false;
										break;
									}
								}
								if (find) break;
							}
							if (find) {
								event.num = j - 1;
								return true;
							}
						}
						return false;
					});
					if (!curs.length) event.target = null;
					else if (qcp === 'zc') event.target = curs.randomGet();
					else {
						let me = false;
						if (curs.includes(game.me)) {
							me = true;
							curs.remove(game.me);
						}
						if (curs.length) event.target = curs.randomGet();
						else if (me && qcp !== 'no') event.target = game.me;
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
				if (lib.config.extension_胜负统计_qcs === 'same')
					switch (get.mode()) {
						case 'identity':
							if (sd === 'zhong') {
								if (id === 'fan' || id === 'zhong') hx = 6;
								else hx = 8;
							} else if (sd === 'purple') {
								if (id.indexOf('Zhu') === 1) hx = 4;
								else hx = 5;
							} else hx = get.config('choice_' + id);
							break;
						case 'versus':
							if (sd === 'two') hx = 7;
							else if (sd === 'guandu') hx = 4;
							else hx = 8;
							break;
						case 'doudizhu':
							if (sd === 'normal') hx = get.config('choice_' + id);
							else if (id === 'zhu') {
								if (sd === 'kaihei') hx = 5;
								else if (sd === 'huanle' || sd === 'binglin') hx = 7;
								else hx = 4;
							} else {
								if (sd === 'kaihei') hx = 3;
								else hx = 4;
							}
							break;
						default:
							if (typeof get.config('choice_' + id) === 'number') hx = get.config('choice_' + id);
					}
				else hx = parseInt(lib.config.extension_胜负统计_qcs);
				for (let i = 0; i < ts.length; i++) {
					if (player !== game.me && lib.config.extension_胜负统计_wj.includes(ts[i])) continue;
					list.push(ts[i]);
					if (list.length >= hx) break;
				}
				if (!list.length) {
					alert('没有可供候选的武将！');
					event.finish();
					return;
				}
				if (
					(event.target === game.zhu &&
						(game.players.length > 4 ||
							(game.players.length === 4 && sd === 'normal' && lib.config.extension_AI优化_fixFour))) ||
					(id && (id === 'mingzhong' || id.indexOf('Zhu') > 0)) ||
					event.target === game.friendZhu ||
					event.target === game.enemyZhu
				)
					event.add = true;
				if (event.target.name2 === undefined) str = '武将';
				else if (event.num) str = '副将';
				else str = '主将';
				if (lib.config.extension_胜负统计_delayQc !== '0') game.delay(parseInt(lib.config.extension_胜负统计_delayQc));
				if (list.length === 1) event._result = { links: list };
				else
					event.target.chooseButton(true, ['请选择一张武将牌替换你的' + str, [list, 'character']]).set('ai', (button) => {
						return get.rank(button.link);
					});
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
				if (event.target.name2 !== undefined) {
					j += '主将';
					event.target.init(name, event.target.name2);
				} else event.target.init(name);
			}
			if (event.add) {
				event.target.maxHp++;
				event.target.hp++;
			}
			if (!lib.character[name] || !lib.character[name][4] || !lib.character[name][4].includes('hiddenSkill'))
				event.target.showCharacter(event.num, false);
			game.log(
				'#g' + get.cnNumber(player.getSeatNum() + 1) + '号位',
				j,
				'#y' + (lib.translate[old] || '未知'),
				'更换为',
				'#y' + (lib.translate[name] || '未知')
			);
			'step 2'
			event.target.update();
			event.trigger('showCharacterEnd');
		},
	};
	lib.skill._sftj_fake_prohibited = {
		//伪禁
		trigger: {
			global: 'gameStart',
			player: 'showCharacterEnd',
		},
		filter(event, player) {
			return lib.config.extension_胜负统计_Wj && player !== game.me && lib.config.extension_胜负统计_wj;
		},
		silent: true,
		unique: true,
		priority: 1024,
		charlotte: true,
		superCharlotte: true,
		content() {
			'step 0'
			if (!_status.sftjlist) {
				//未上场角色池
				let list = [];
				if (_status.connectMode) list = get.charactersOL();
				else
					for (let i in lib.character) {
						if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
						list.push(i);
					}
				game.countPlayer2((current) => {
					list.remove(current.name);
					list.remove(current.name1);
					list.remove(current.name2);
				});
				_status.sftjlist = list;
			}
			if (player.name1 !== undefined && lib.config.extension_胜负统计_wj.includes(player.name1)) event.num = 0;
			else if (player.name2 !== undefined && lib.config.extension_胜负统计_wj.includes(player.name2)) event.num = 1;
			else event.finish();
			'step 1'
			let list = [],
				hx = 6,
				sd = _status.mode,
				id = player.identity,
				str;
			if (lib.config.extension_胜负统计_wjs === 'same')
				switch (get.mode()) {
					case 'identity':
						if (sd === 'zhong') {
							if (id === 'fan' || id === 'zhong') hx = 6;
							else hx = 8;
						} else if (sd === 'purple') {
							if (id.indexOf('Zhu') === 1) hx = 4;
							else hx = 5;
						} else hx = get.config('choice_' + id);
						break;
					case 'versus':
						if (sd === 'two') hx = 7;
						else if (sd === 'guandu') hx = 4;
						else hx = 8;
						break;
					case 'doudizhu':
						if (sd === 'normal') hx = get.config('choice_' + id);
						else if (id === 'zhu') {
							if (sd === 'kaihei') hx = 5;
							else if (sd === 'huanle' || sd === 'binglin') hx = 7;
							else hx = 4;
						} else {
							if (sd === 'kaihei') hx = 3;
							else hx = 4;
						}
						break;
					default:
						if (typeof get.config('choice_' + id) === 'number') hx = get.config('choice_' + id);
				}
			else hx = parseInt(lib.config.extension_胜负统计_wjs);
			_status.sftjlist.randomSort();
			for (let i = 0; i < _status.sftjlist.length; i++) {
				if (!lib.config.extension_胜负统计_wj.includes(_status.sftjlist[i])) list.push(_status.sftjlist[i]);
				if (list.length >= hx) break;
			}
			if (!list.length) {
				alert('没有可供候选的武将！');
				event.finish();
				return;
			}
			if (
				(player === game.zhu &&
					(game.players.length > 4 || (game.players.length === 4 && sd === 'normal' && lib.config.extension_AI优化_fixFour))) ||
				(id && (id === 'mingzhong' || id.indexOf('Zhu') > 0)) ||
				player === game.friendZhu ||
				player === game.enemyZhu
			)
				event.add = true;
			else event.add = false;
			if (player.name2 === undefined) str = '武将';
			else if (event.num) str = '副将';
			else str = '主将';
			if (lib.config.extension_胜负统计_delayWj !== '0') game.delay(parseInt(lib.config.extension_胜负统计_delayWj));
			if (list.length === 1) event._result = { links: list };
			else
				player.chooseButton(true, ['请选择一张武将牌替换你的' + str, [list, 'character']]).set('ai', (button) => {
					return get.rank(button.link);
				});
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
				if (player.name2 !== undefined) {
					j += '主将';
					player.init(name, player.name2);
				} else player.init(name);
			}
			if (event.add) {
				player.maxHp++;
				player.hp++;
			}
			if (!lib.character[name] || !lib.character[name][4] || !lib.character[name][4].includes('hiddenSkill'))
				player.showCharacter(event.num, false);
			game.log(
				'#g' + get.cnNumber(player.getSeatNum() + 1) + '号位',
				j,
				'#y' + (lib.translate[old] || '未知'),
				'更换为',
				'#y' + (lib.translate[name] || '未知')
			);
			'step 3'
			player.update();
			event.trigger('showCharacterEnd');
		},
	};
	lib.skill._sftj_fixWj = {
		//伪禁列表
		enable: 'phaseUse',
		filter(event, player) {
			return player === game.me && lib.config.extension_胜负统计_fixWj;
		},
		filterTarget(card, player, target) {
			if (target.name.indexOf('unknown') === 0 && (target.name2 === undefined || target.name2.indexOf('unknown') === 0)) return false;
			return true;
		},
		selectTarget: [0, Infinity],
		multitarget: true,
		multiline: true,
		prompt: '若选择角色则对这些角色的武将牌进行加入/移出伪禁列表操作，否则从所有武将包选择进行操作',
		log: false,
		charlotte: true,
		superCharlotte: true,
		content() {
			'step 0'
			targets.sortBySeat();
			if (targets.length) {
				event.names = [];
				for (let i of targets) {
					if (i.name.indexOf('unknown')) event.names.push(i.name);
					if (i.name2 !== undefined && i.name2.indexOf('unknown')) event.names.push(i.name2);
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
					let func = (player, list, id) => {
						let choiceList = ui.create.dialog('请选择要移动的武将所在的武将包');
						choiceList.videoId = id;
						for (let i = 0; i < list.length; i++) {
							let str =
								'<div class="popup text" style="width:calc(100% - 10px);display:inline-block">' + list[i] + '</div>';
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
					next.set('ai', (button) => {
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
				if (lib.config.extension_胜负统计_wj.includes(i)) event.yc.push(i);
				else event.jr.push(i);
			}
			if (event.jr.length)
				player
					.chooseButton(['请选择要加入伪禁列表的武将，直接点“确定”则全部加入', [event.jr, 'character']], [0, Infinity])
					.set('ai', (button) => {
						return 0;
					});
			else event.goto(4);
			'step 3'
			if (result.bool) {
				if (result.links && result.links.length) lib.config.extension_胜负统计_wj.addArray(result.links);
				else lib.config.extension_胜负统计_wj.addArray(event.jr);
				game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_胜负统计_wj);
			}
			'step 4'
			if (event.yc.length)
				player
					.chooseButton(['请选择要移出伪禁列表的武将,直接点“确定”则全部移出', [event.yc, 'character']], [0, Infinity])
					.set('ai', (button) => {
						return 0;
					});
			else event.finish();
			'step 5'
			if (result.bool) {
				if (result.links && result.links.length) lib.config.extension_胜负统计_wj.removeArray(result.links);
				else lib.config.extension_胜负统计_wj.removeArray(event.yc);
				game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_胜负统计_wj);
			}
		},
		ai: {
			result: {
				target: 0,
			},
		},
	};
	lib.translate._sftj_fixWj = '<font color=#00FFFF>伪禁</font>';
}
