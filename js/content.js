import { lib, game, ui, get, ai, _status } from './utils.js';

export function content(config, pack) {
	/**
	 * 获取num个符合筛选条件的候选武将列表
	 * @param { number } num - 需要获取的候选武将数量
	 * @param { (character: string, selectedList: string[]) => boolean } filter - 筛选函数
	 *
	 * character: 当前检查的武将名称
	 *
	 * selectedList: 已选中的武将列表，返回是否保留该武将
	 * @returns { string[] } 符合条件的武将名称数组（实际数量可能小于num）
	 */
	lib.element.player.fetchCandidates = (num, filter) => {
		let list = [];
		if (!_status.sftjlist) {
			//未上场角色池
			_status.sftjlist = [];
			if (_status.connectMode) _status.sftjlist = get.charactersOL();
			else
				for (let i in lib.character) {
					if (lib.filter.characterDisabled2(i) || lib.filter.characterDisabled(i)) continue;
					_status.sftjlist.push(i);
				}
			game.countPlayer2((current) => {
				_status.sftjlist.remove(current.name);
				_status.sftjlist.remove(current.name1);
				_status.sftjlist.remove(current.name2);
			});
		}
		if (typeof num !== 'number' || isNaN(num)) num = 1;
		if (typeof filter !== 'function') filter = () => true;
		_status.sftjlist.randomSort();
		for (let i = 0; i < _status.sftjlist.length; i++) {
			if (this !== game.me && lib.config.extension_胜负统计_wj.includes(_status.sftjlist[i])) continue;
			if (filter(_status.sftjlist[i], list)) list.push(_status.sftjlist[i]);
			if (list.length >= num) break;
		}
		return list;
	};
	lib.skill._sftj_start = {
		trigger: { global: 'gameStart' },
		filter(event, player) {
			return player === game.me;
		},
		silent: true,
		priority: 157,
		charlotte: true,
		superCharlotte: true,
		async content(event, trigger, player) {
			game.countPlayer2((current) => {
				current.storage.sftj = {
					cg1: current.name1,
					cg2: current.name2,
				};
			});
		},
	};
	lib.skill._sftj_remove_duplicate = { //同名武将去重
		trigger: {
			global: ['gameStart', 'showCharacterEnd', 'changeCharacterEnd'],
		},
		filter(event, player) {
			return lib.config.extension_胜负统计_qc && player === game.me;
		},
		silent: true,
		unique: true,
		priority: 729,
		charlotte: true,
		superCharlotte: true,
		async content(event, trigger, player) {
			const currents = game.filterPlayer().randomSort();
			let rawNames = [],
				target = null,
				name,
				index;
			if (!_status.sftj_qc) _status.sftj_qc = [];
			for (const current of currents) {
				for (let j = 1; j < 3; j++) {
					let info = current['name' + j];
					if (typeof info !== 'string' || info.startsWith('unknown') || _status.sftj_qc.includes(info)) continue;
					const rawName = get.rawName(current['name' + j]);
					if (rawNames.includes(rawName)) {
						target = current;
						name = info;
						index = j - 1;
						rawNames = rawName;
						break;
					} else rawNames.push(rawName);
				}
				if (target) break;
			}
			if (!target) return;
			let sd = _status.mode,
				qcp = lib.config.extension_胜负统计_qcp;
			if (get.mode() === 'single' && sd === 'dianjiang') {
				if (!lib.config.extension_胜负统计_single_alerted) {
					alert('当前模式为点将模式，不在［武将登场去重］功能管辖范围内');
					game.saveExtensionConfig('胜负统计', 'single_alerted', true);
				}
				return;
			}
			if (
				(target === game.me && qcp !== 'zc') ||
				target === game.boss ||
				(target.identity === 'zhong' && get.mode() === 'boss') ||
				target === game.trueZhu ||
				target === game.falseZhu
			) {
				let names = [];
				game.filterPlayer((cur) => {
					if (
						cur === game.boss ||
						(cur.identity === 'zhong' && get.mode() === 'boss') ||
						cur === game.trueZhu ||
						cur === game.falseZhu
					)
						return false;
					for (let j = 1; j < 3; j++) {
						let info = cur['name' + j];
						if (typeof info !== 'string' || info.startsWith('unknown')) continue;
						const rawName = get.rawName(cur['name' + j]);
						if (rawNames === rawName && (target !== cur || index !== j - 1))
							names.push({
								target: cur,
								name: info,
								index: j - 1,
							});
					}
				});
				if (!names.length) target = null;
				else if (qcp === 'zc') {
					({ target, name, index } = names.randomGet());
				} else {
					let me = [];
					for (let i = 0; i < names.length; i++) {
						if (names.target === game.me) me.push(names.splice(i--, 1)[0]);
					}
					if (names.length) ({ target, name, index } = names.randomGet());
					else if (me.length && qcp === 'ai') ({ target, name, index } = me.randomGet());
					else target = null;
				}
			}
			if (!target) {
				alert(get.translation(name) + '受情景约束，不能替换' + get.translation(name));
				_status.sftj_qc.push(name);
				return;
			}
			let hx = 6,
				id = target.identity;
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
			const list = target.fetchCandidates(hx);
			if (!list.length) {
				alert('没有可供候选的武将！');
				return;
			}
			let str;
			if (target.name2 === undefined) str = '武将牌';
			else if (index) str = '副将';
			else str = '主将';
			if (lib.config.extension_胜负统计_delayQc !== '0') await game.delay(Number(lib.config.extension_胜负统计_delayQc));
			let result;
			if (list.length === 1) result = { links: list };
			else
				result = await target
					.chooseButton(true, ['请选择一张武将牌替换你的' + str, [list, 'character']])
					.set('ai', (button) => {
						return get.rank(button.link);
					})
					.forResult();
			const newname = result.links[0];
			_status.sftjlist.remove(newname);
			_status.sftjlist.push(name);
			await target.reinitCharacter(name, newname);
			if (get.character(name).hasHiddenSkill) await target.showCharacter(index, false);
		},
	};
	lib.skill._sftj_fake_prohibited = { //伪禁
		trigger: {
			global: 'gameStart',
			player: ['showCharacterEnd', 'changeCharacterEnd'],
		},
		filter(event, player) {
			return lib.config.extension_胜负统计_Wj && player !== game.me && lib.config.extension_胜负统计_wj;
		},
		silent: true,
		unique: true,
		priority: 1024,
		charlotte: true,
		superCharlotte: true,
		ruleSkill: true,
		async content(event, trigger, player) {
			for (const index of [0, 1]) {
				const old = player['name' + (index + 1)];
				if (old === undefined) continue;
				if (!lib.config.extension_胜负统计_wj.includes(old)) continue;
				let hx = 6,
					sd = _status.mode,
					id = player.identity;
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
				const list = player.fetchCandidates(hx);
				if (!list.length) {
					alert('没有可供候选的武将！');
					return;
				}
				let str;
				if (player.name2 === undefined) str = '武将牌';
				else if (index) str = '副将';
				else str = '主将';
				if (lib.config.extension_胜负统计_delayWj !== '0') await game.delay(Number(lib.config.extension_胜负统计_delayWj));
				let result;
				if (list.length === 1) result = { links: list };
				else
					result = await player
						.chooseButton(true, ['请选择一张武将牌替换你的' + str, [list, 'character']])
						.set('ai', (button) => {
							return get.rank(button.link);
						})
						.forResult();
				const name = result.links[0];
				_status.sftjlist.remove(name);
				_status.sftjlist.push(old);
				await player.reinitCharacter(old, name);
				if (get.character(name).hasHiddenSkill) await player.showCharacter(index, false);
			}
		},
	};
	lib.skill._sftj_filterSameName = { //同名武将筛选
		enable: 'phaseUse',
		filter(event, player) {
			if (player !== game.me || lib.config.extension_官将重修_filterSameName) return false;
			return lib.config.extension_胜负统计_filterSameName;
		},
		filterTarget: true,
		log: false,
		charlotte: true,
		superCharlotte: true,
		ruleSkill: true,
		prompt: '在当前模式快速启用或禁用与所选武将同名的武将',
		async content(event, trigger, player) {
			const banname = get.mode() + '_banned';
			if (!lib.config[banname]) lib.config[banname] = [];
			for (let idx = 1; idx < 2; idx++) {
				if (typeof event.target['name' + idx] !== 'string') continue;
				let name = get.rawName(event.target['name' + idx]),
					enable = [],
					disable = [];
				for (let i in lib.character) {
					let temp = get.rawName(i);
					if (temp === name) {
						if (lib.config[banname].includes(i)) disable.push(i);
						else enable.push(i);
					}
				}
				if (enable.length) {
					const result = await player
						.chooseButton(['选择要禁用的武将，直接点“确定”则全部禁用', [enable, 'character']], [0, Infinity])
						.set('ai', (button) => 0)
						.forResult();
					if (result.bool) {
						let arr;
						if (result.links && result.links.length) arr = result.links;
						else arr = enable;
						lib.config[banname].addArray(arr);
					}
				}
				if (disable.length) {
					const result = await player
						.chooseButton(['选择要启用的武将，直接点“确定”则全部启用', [disable, 'character']], [0, Infinity])
						.set('ai', (button) => 0)
						.forResult();
					if (result.bool) {
						let arr;
						if (result.links && result.links.length) arr = result.links;
						else arr = disable;
						lib.config[banname].removeArray(arr);
					}
				}
			}
			game.saveConfig(banname, lib.config[banname]);
		},
	};
	lib.translate._sftj_filterSameName = '<font color=#39FF14>同名武将筛选</font>';
	lib.skill._sftj_fixWj = { //伪禁列表
		enable: 'phaseUse',
		filter(event, player) {
			if (player !== game.me || lib.config.extension_AI优化_fixWj) return false;
			return lib.config.extension_胜负统计_fixWj;
		},
		filterTarget(card, player, target) {
			if (target.name.indexOf('unknown') === 0 && (target.name2 === undefined || target.name2.indexOf('unknown') === 0))
				return false;
			return true;
		},
		selectTarget: [0, Infinity],
		multitarget: true,
		multiline: true,
		prompt: '若选择角色则对这些角色的武将牌进行加入/移出伪禁列表操作，否则从所有武将包选择进行操作',
		log: false,
		charlotte: true,
		superCharlotte: true,
		ruleSkill: true,
		async content(event, trigger, player) {
			const targets = event.targets;
			let names = [];
			if (targets.length) {
				targets.sortBySeat();
				for (const target of targets) {
					if (!target.name1.startsWith('unknown')) names.add(target.name1);
					if (target.name2 !== undefined && !target.name2.startsWith('unknown')) names.add(target.name2);
				}
			} else {
				let packs = [];
				for (let i in lib.characterPack) {
					// if (Object.prototype.toString.call(lib.characterPack[i]) === '[object Object]')
					packs.push(i);
				}
				if (!packs.length) return;
				const result = game.me
					.chooseButton([
						'请选择要操作的武将所在的武将包',
						[
							packs.map((pack) => [
								pack,
								ui.joint`
								<div class="popup text" style="width:calc(100% - 10px); display:inline-block">
									${lib.translate[i + '_character_config']}
								</div>
							`,
							]),
							'textbutton',
						],
					])
					.set('forced', true)
					.set('ai', (button) => 0)
					.set('selectButton', [0, packs.length])
					.set('complexSelect', false)
					.forResult();
				if (result.links?.length) {
					for (const pack of result.links) {
						for (let i in lib.characterPack[pack]) {
							names.push(i);
						}
					}
					if (!names.length) {
						alert('所选武将包不包含武将');
						return;
					}
				} else return;
			}
			let jr = [],
				yc = [];
			for (let i of names) {
				if (lib.config.extension_胜负统计_wj.includes(i)) yc.push(i);
				else jr.push(i);
			}
			if (jr.length) {
				const result = await player
					.chooseButton(['请选择要加入伪禁列表的武将，直接点“确定”则全部加入', [jr, 'character']], [0, Infinity])
					.set('ai', (button) => 0)
					.forResult();
				if (result.bool) {
					if (result.links?.length) lib.config.extension_胜负统计_wj.addArray(result.links);
					else lib.config.extension_胜负统计_wj.addArray(jr);
				}
			}
			if (yc.length) {
				const result = await player
					.chooseButton(['请选择要移出伪禁列表的武将,直接点“确定”则全部移出', [yc, 'character']], [0, Infinity])
					.set('ai', (button) => 0)
					.forResult();
				if (result.bool) {
					if (result.links?.length) lib.config.extension_胜负统计_wj.removeArray(result.links);
					else lib.config.extension_胜负统计_wj.removeArray(yc);
				}
			}
			game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_胜负统计_wj);
		},
		ai: {
			result: {
				target: 0,
			},
		},
	};
	lib.translate._sftj_fixWj = '<font color=#00FFFF>伪禁</font>';
}
