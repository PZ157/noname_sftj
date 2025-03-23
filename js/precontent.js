import { lib, game, ui, get, ai, _status } from './utils.js';

export function precontent(config, pack) {
	lib.arenaReady.push(() => {
		game.saveExtensionConfig('胜负记录', 'operateJl', false);
		if (!Array.isArray(lib.config.extension_胜负统计_wj)) {
			if (Array.isArray(lib.config.extension_AI优化_wj) && lib.config.extension_AI优化_wj.length) {
				game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_AI优化_wj);
				alert('已成功载入『AI优化』中对应伪禁列表配置');
			} else if (Array.isArray(lib.config.extension_官将重修_wj) && lib.config.extension_官将重修_wj.length) {
				game.saveExtensionConfig('胜负统计', 'wj', lib.config.extension_官将重修_wj);
				alert('已成功载入『官将重修』中对应伪禁列表配置');
			} else game.saveExtensionConfig('胜负统计', 'wj', []);
		}
	});
	lib.onfree.push(() => {
		game.sfRefresh(true, true);
	});
	lib.onover.push((result) => {
		if (!lib.config.extension_胜负统计_record) return;
		let curs = game.filterPlayer2(true, null, true),
			wins = [],
			can = true,
			id = [],
			mode = get.mode();
		if (mode === 'identity') {
			if (_status.mode === 'purple') {
				if (result || lib.config.extension_胜负统计_sw) id = game.me.identity;
				else if (
					game.hasPlayer((current) => {
						if (current.identity.indexOf('Zhu') === 1) {
							id = current.identity;
							return true;
						}
						return false;
					})
				);
				else if (
					!game.hasPlayer((current) => {
						return current.identity.indexOf('Ye') !== 1;
					})
				)
					id = 'rYe';
				else id = 'none';
				switch (id) {
					case 'rZhu':
					case 'rZhong':
					case 'bNei':
						wins = game.filterPlayer2(
							(target) => {
								return ['rZhu', 'rZhong', 'bNei'].includes(target.identity);
							},
							null,
							true
						);
						break;
					case 'bZhu':
					case 'bZhong':
					case 'rNei':
						wins = game.filterPlayer2(
							(target) => {
								return ['bZhu', 'bZhong', 'rNei'].includes(target.identity);
							},
							null,
							true
						);
						break;
					case 'rYe':
					case 'bYe':
						wins = game.filterPlayer2(
							(target) => {
								return ['rYe', 'bYe'].includes(target.identity);
							},
							null,
							true
						);
						break;
				}
			} else {
				if (result || lib.config.extension_胜负统计_sw) id = game.me.identity;
				else if (game.players.length === 1) id = game.players[0].identity;
				else if (game.zhu.isDead()) id = 'fan';
				else id = 'zhu';
				switch (id) {
					case 'fan':
						wins = game.filterPlayer2(
							(target) => {
								return target.identity === 'fan';
							},
							null,
							true
						);
						break;
					case 'nei':
						wins = game.players;
						break;
					default:
						wins = game.filterPlayer2(
							(target) => {
								return ['zhu', 'zhong', 'mingzhong'].includes(target.identity);
							},
							null,
							true
						);
				}
			}
		} else if (mode === 'guozhan') {
			if (result || lib.config.extension_胜负统计_sw) {
				if (game.me.identity === 'ye') wins = [game.me];
				else {
					id = lib.character[game.me.name1][1];
					wins = game.filterPlayer2(
						(target) => {
							return target.identity !== 'ye' && lib.character[target.name1][1] === id;
						},
						null,
						true
					);
				}
			} else if (
				game.countPlayer((current) => {
					if (current.identity === 'ye') return true;
					let g = lib.character[current.name1][1];
					if (!id.includes(g)) {
						id.add(g);
						return true;
					}
					return false;
				}) > 1
			)
				can = false;
			else if (game.players[0].identity === 'ye') wins = game.players;
			else {
				id = lib.character[game.players[0].name1][1];
				wins = game.filterPlayer2(
					(target) => {
						return target.identity !== 'ye' && lib.character[target.name1][1] === id;
					},
					null,
					true
				);
			}
		} else if (mode === 'doudizhu' || mode === 'single' || mode === 'boss') {
			if ((game.zhu && game.zhu.isDead()) || (game.boss && game.boss.isDead()))
				wins = game.filterPlayer2(
					(target) => {
						return target.identity !== 'zhu' && target.identity !== 'zhong';
					},
					null,
					true
				);
			else
				wins = game.filterPlayer2(
					(target) => {
						return target.identity === 'zhu' || target.identity === 'zhong';
					},
					null,
					true
				);
		} else {
			if (result || lib.config.extension_胜负统计_sw)
				wins = game.filterPlayer2(
					(target) => {
						return target.side === game.me.side;
					},
					null,
					true
				);
			else if (
				game.countPlayer((current) => {
					for (let s of id) {
						if (s.side === current.side) return false;
					}
					id.add(current);
					return true;
				}) > 1
			)
				can = false;
			else
				wins = game.filterPlayer2(
					(target) => {
						return target.side === game.players[0].side;
					},
					null,
					true
				);
		}
		for (let i of curs) {
			if (((!can || !lib.config.extension_胜负统计_tryAll) && game.me !== i) || (mode === 'boss' && i.identity === 'zhong'))
				continue;
			let bool;
			if (lib.config.extension_胜负统计_sw) {
				if (wins.includes(i)) bool = result;
				else bool = !result;
			} else if (wins.includes(i)) bool = true;
			else bool = false;
			let cgn = get.sfConfigName(i.identity || 'unknown'),
				names = [];
			if (i.storage.sftj && i.name1 !== i.storage.sftj.cg1) {
				if (lib.config.extension_胜负统计_change === 'pre' && i.storage.sftj.cg1 !== undefined) names.push(i.storage.sftj.cg1);
				else if (lib.config.extension_胜负统计_change === 'nxt' && i.name1 !== undefined) names.push(i.name1);
			} else if (i.name1 !== undefined) names.push(i.name1);
			if (i.storage.sftj && i.name2 !== i.storage.sftj.cg2) {
				if (lib.config.extension_胜负统计_change === 'pre' && i.storage.sftj.cg2 !== undefined) names.push(i.storage.sftj.cg2);
				else if (lib.config.extension_胜负统计_change === 'nxt' && i.name2 !== undefined) names.push(i.name2);
			} else if (i.name2 !== undefined) names.push(i.name2);
			for (let j of names) {
				if (lib.config[cgn][j] === undefined) lib.config[cgn][j] = { win: 0, lose: 0 };
				if (bool === true) lib.config[cgn][j].win++;
				else lib.config[cgn][j].lose++;
			}
		}
		const cgns = get.sfConfigName();
		for (let i of cgns) {
			game.saveConfig(i, lib.config[i]);
		}
	});
}
