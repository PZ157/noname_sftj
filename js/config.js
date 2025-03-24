import { lib, game, ui, get, ai, _status, security } from './utils.js';

export const config = {
	apart: {
		name: '<span style="font-family: xinwei">区分当前游戏模式</font>',
		intro: '开启后，武将胜负统计将<font color=#FF0000>区分开当前游戏模式</font>（即按照菜单->开始->模式->游戏模式分开统计）',
		init: true,
		onclick(item) {
			game.saveExtensionConfig('胜负统计', 'apart', item);
			if (!lib.config.extension_胜负统计_apart_alerted) {
				game.saveExtensionConfig('胜负统计', 'apart_alerted', true);
				alert('为避免调整此配置后继续使用本扩展功能可能带来的冲突，将自动重启游戏');
			}
			game.reload();
		},
	},
	display: {
		name: '<span style="font-family: xinwei">胜负场数相关显示</span>',
		intro: '调整武将信息上方的胜率、胜负场数相关显示',
		init: 'all',
		item: {
			all: '都显示',
			sf: '显示胜负场数',
			sl: '显示胜率',
			off: '不显示',
		},
	},
	record: {
		name: '<span style="font-family: xingkai">武将胜负记录</span>',
		intro: '开启后，游戏结束将根据玩家胜负记录玩家所使用的武将胜负',
		init: true,
	},
	tryAll: {
		name: '<span style="font-family: xingkai">尝试记录全场武将</span>',
		intro: '开启后，游戏结束将记录根据玩家胜负可以推测出来胜负的角色所使用的武将胜负',
		init: false,
	},
	sw: {
		name: '<span style="font-family: xingkai">其他阵营视为同一阵营</span>',
		intro: '开启后，游戏结束进行记录时其他阵营将视为同一阵营，即玩家方赢、其余方均输，玩家方没赢，其余方均赢',
		init: false,
	},
	change: {
		name: '<span style="font-family: xingkai">更换武将角色</font>',
		intro: '如果一个角色在游戏结束时用的武将和游戏开始时不同，可以选择记录游戏开始时的（最初的）或者记录游戏结束时的（最后的）',
		init: 'off',
		item: {
			off: '不记录',
			pre: '记录最初的',
			nxt: '记录最后的',
		},
	},
	slRank: {
		name: '当前模式胜率排行榜',
		clear: true,
		onclick() {
			let mode = get.currentModeInfo(true),
				cgns = get.sfConfigName(),
				num = 0;
			for (let i of cgns) {
				let rankNum = parseInt(lib.config.extension_胜负统计_rankNum),
					sortedKeys = Object.entries(get.purifySFConfig(lib.config[i], parseInt(lib.config.extension_胜负统计_min)))
						.sort((a, b) => {
							let res = Math.round(100000 * a[1].sl) - Math.round(100000 * b[1].sl);
							if (rankNum > 0) res = -res;
							if (res === 0) return b[1].win + b[1].lose - a[1].win - a[1].lose;
							return res;
						})
						.slice(0, Math.abs(rankNum))
						.map((entry) => entry[0]);
				if (!sortedKeys.length) continue;
				let txt = mode + '武将' + get.identityInfo(i) + '胜率排行榜（' + (rankNum > 0 ? '正序' : '倒序') + '）';
				for (let j = 0; j < sortedKeys.length; j++) {
					txt +=
						'\n   第' +
						(j + 1) +
						'名   ' +
						(lib.translate[sortedKeys[j]] || '未知') +
						'|' +
						sortedKeys[j] +
						'\n                     ' +
						lib.config[i][sortedKeys[j]].win +
						'胜' +
						lib.config[i][sortedKeys[j]].lose +
						'负      胜率：' +
						Math.round(100000 * lib.config[i][sortedKeys[j]].sl) / 1000 +
						'%';
				}
				num++;
				alert(txt);
			}
			if (!num) alert('当前模式暂无符合条件的记录');
		},
	},
	rankNum: {
		name: '<span style="font-family: xingkai">排行榜展示</font>：',
		intro: '和选项连起来读',
		init: '10',
		item: {
			10: '前十名',
			5: '前五名',
			15: '前十五名',
			20: '前二十名',
			50: '前五十名',
			'-10': '最后十名',
			'-5': '最后五名',
			'-15': '最后十五名',
			'-20': '最后二十名',
			'-50': '最后五十名',
		},
	},
	min: {
		name: '<span style="font-family: xingkai">只筛选总场数：</font>',
		intro: '在展示当前游戏模式武将胜率排行榜时，只在符合本配置条件的记录中筛选',
		init: '10',
		item: {
			3: '不少于3局的',
			5: '不少于5局的',
			7: '不少于7局的',
			10: '不少于10局的',
			20: '不少于20局的',
			30: '不少于30局的',
			50: '不少于50局的',
			0: '不少于0局的',
		},
	},
	loadJl: {
		name: '载入当前模式武将胜负记录',
		clear: true,
		onclick() {
			let container = ui.create.div('.popup-container.editor');
			let node = container;
			let map = get.sfConfigName().map((i) => i.slice(15));
			let str = '//请在{}内编辑，务必使用英文标点符号！';
			for (let i of map) {
				str += '\n_status.' + i + ' = { //在此填写你想载入的武将' + get.identityInfo(i) + '胜负记录\n\t\n};\n';
			}
			node.code = str;
			ui.window.classList.add('shortcutpaused');
			ui.window.classList.add('systempaused');
			let saveInput = function () {
				let code;
				if (container.editor) code = container.editor.getValue();
				else if (container.textarea) code = container.textarea.value;
				try {
					eval(code);
					for (let i of map) {
						if (_status[i] && Object.prototype.toString.call(_status[i]) !== '[object Object]') throw 'typeError';
					}
				} catch (e) {
					if (e === 'typeError') alert('类型不为[object Object]');
					else alert('代码语法有错误，请仔细检查（' + e + '）');
					return;
				}
				for (let i of map) {
					if (_status[i]) {
						const cgn = 'extension_胜负统计_' + i;
						for (let name in _status[i]) {
							lib.config[cgn][name] = _status[i][name];
							if (!lib.config[cgn][name].win) lib.config[cgn][name].win = 0;
							if (!lib.config[cgn][name].lose) lib.config[cgn][name].lose = 0;
							let all = lib.config[cgn][name].win + lib.config[cgn][name].lose;
							if (all) lib.config[cgn][name].sl = lib.config[cgn][name].win / all;
							else delete lib.config[cgn][name];
						}
						game.saveConfig(i, lib.config[cgn]);
					}
				}
				ui.window.classList.remove('shortcutpaused');
				ui.window.classList.remove('systempaused');
				container.delete();
				container.code = code;
				delete window.saveNonameInput;
			};
			window.saveNonameInput = saveInput;
			let editor = ui.create.editor(container, saveInput);
			if (node.aced) {
				ui.window.appendChild(node);
				node.editor.setValue(node.code, 1);
			} else if (lib.device === 'ios') {
				ui.window.appendChild(node);
				if (!node.textarea) {
					let textarea = document.createElement('textarea');
					editor.appendChild(textarea);
					node.textarea = textarea;
					lib.setScroll(textarea);
				}
				node.textarea.value = node.code;
			} else {
				if (!window.CodeMirror) {
					import('../../../game/codemirror.js').then(() => {
						lib.codeMirrorReady(node, editor);
					});
					lib.init.css(lib.assetURL + 'layout/default', 'codemirror');
				} else lib.codeMirrorReady(node, editor);
			}
		},
	},
	copyJl: {
		name: '复制当前模式武将胜负记录',
		clear: true,
		onclick() {
			const cgns = get.sfConfigName();
			const mode = get.currentModeInfo(true) + '所有武将的';
			let text = '';
			for (let i of cgns) {
				if (!confirm('是否复制' + mode + get.identityInfo(i) + '胜负记录？')) continue;
				let map = lib.config[i] || {};
				text += '_status.' + i.slice(15) + ' = { // ' + mode + get.identityInfo(i) + '胜负记录';
				for (let name in map) {
					text += '\r\t"' + name + '":{\r\t\twin: ' + map[name].win + ',\r\t\tlose: ' + map[name].lose + ',\r\t},';
				}
				text += '\r};\r';
			}
			game.copy(text, '对应胜负记录已成功复制到剪切板，请及时粘贴保存');
		},
	},
	deleteJl: {
		name: '删除当前模式武将胜负记录',
		clear: true,
		onclick() {
			let mode = get.currentModeInfo(true),
				cgns = get.sfConfigName();
			if (cgns.length > 1) {
				let num = 0;
				for (let i of cgns) {
					if (confirm('您确定要清空' + mode + '所有武将的' + get.identityInfo(i) + '胜负记录吗？')) {
						num++;
						game.saveConfig(i, {});
					}
				}
				if (num) alert('已成功清除' + num + '项');
			} else if (confirm('您确定要清空' + lib.translate[get.mode()] + '模式' + mode + '所有武将的胜负记录吗？')) {
				game.saveConfig(cgns[0], {});
				alert('清除成功');
			}
		},
	},
	bd1: {
		clear: true,
		name: '<center>武将去重相关</center>',
	},
	qc: {
		name: '武将登场去重',
		intro: '开启后，游戏开始或隐匿武将展示武将牌时，若场上有同名武将，则令其中随机一名角色再次进行选将并重复此流程。',
		init: false,
	},
	tip1: {
		name: ui.joint`
			<font color=#FF3300>注意！</font>
			此功能进行的选将<font color=#FFFF00>不再额外提供固定武将</font>，且<font color=#FFFF00>暂不支持为特殊模式提供专属将池</font>
		`,
		clear: true,
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
			10: '十',
		},
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
			5: '5秒',
		},
	},
	qcp: {
		name: '玩家去重时',
		intro: ui.joint`
			玩家为重复武将其中一方被选中更换武将时，
			〔人机先执行〕优先令另一方更换武将，若另一方受情景约束不能更换武将，玩家不受此约束，则要求玩家更换武将；
			〔始终不执行〕优先令另一方更换武将，若另一方受情景约束不能更换武将，则不再对这组进行去重操作
		`,
		init: 'ai',
		item: {
			zc: '直接执行',
			ai: '人机先执行',
			no: '始终不执行',
		},
	},
	filterSameName: {
		name: '同名武将筛选',
		intro: '开启后，玩家可于出牌阶段选择场上的武将，系统会给出所有去前缀后与其同名的武将，玩家可在当前模式快速启用或禁用这些武将',
		init: false,
	},
	bd2: {
		clear: true,
		name: '<center>伪禁相关</center>',
	},
	Wj: {
		name: '<font color=#00FFFF>伪</font>玩家可选ai禁选',
		intro: ui.joint`
			开启后，游戏开始或隐匿武将展示武将牌时，
			若场上有ai选择了伪禁列表里包含的ID对应武将，
			则<font color=#FFFF00>勒令其</font>从未加入游戏且伪禁列表不包含的将池里<font color=#FFFF00>再次进行选将</font>
		`,
		init: false,
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
			10: '十',
		},
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
			5: '5秒',
		},
	},
	fixWj: {
		name: '出牌阶段可编辑伪禁',
		intro: '出牌阶段可将场上武将加入/移出伪禁列表，也可以从若干个武将包中选择武将执行此操作',
		init: false,
	},
	editWj: {
		name: '编辑伪禁列表',
		clear: true,
		onclick() {
			let container = ui.create.div('.popup-container.editor');
			let node = container;
			let map = lib.config.extension_胜负统计_wj || [];
			let str = 'wj = [ //请在[]内编辑，务必使用英文标点符号！';
			for (let i = 0; i < map.length; i++) {
				str += '\n\t"' + map[i] + '",';
			}
			str += '\n];\n';
			node.code = str;
			ui.window.classList.add('shortcutpaused');
			ui.window.classList.add('systempaused');
			let saveInput = function () {
				let code;
				if (container.editor) code = container.editor.getValue();
				else if (container.textarea) code = container.textarea.value;
				try {
					var { wj } = security.exec2(code);
					if (!Array.isArray(wj)) throw 'typeError';
				} catch (e) {
					if (e === 'typeError') alert('类型不为[object Array]');
					else alert('代码语法有错误，请仔细检查（' + e + '）');
					return;
				}
				game.saveExtensionConfig('胜负统计', 'wj', wj);
				ui.window.classList.remove('shortcutpaused');
				ui.window.classList.remove('systempaused');
				container.delete();
				container.code = code;
				delete window.saveNonameInput;
			};
			window.saveNonameInput = saveInput;
			let editor = ui.create.editor(container, saveInput);
			if (node.aced) {
				ui.window.appendChild(node);
				node.editor.setValue(node.code, 1);
			} else if (lib.device === 'ios') {
				ui.window.appendChild(node);
				if (!node.textarea) {
					let textarea = document.createElement('textarea');
					editor.appendChild(textarea);
					node.textarea = textarea;
					lib.setScroll(textarea);
				}
				node.textarea.value = node.code;
			} else {
				if (!window.CodeMirror) {
					import('../../../game/codemirror.js').then(() => {
						lib.codeMirrorReady(node, editor);
					});
					lib.init.css(lib.assetURL + 'layout/default', 'codemirror');
				} else lib.codeMirrorReady(node, editor);
			}
		},
	},
	copyWj: {
		name: '一键复制伪禁列表',
		clear: true,
		onclick() {
			let map = lib.config.extension_胜负统计_wj || [];
			let txt = '';
			for (let i = 0; i < map.length; i++) {
				txt += '\r\t"' + map[i] + '",';
			}
			game.copy(txt, '伪禁列表已成功复制到剪切板');
		},
	},
	clearWj: {
		name: '清空伪禁列表',
		clear: true,
		onclick() {
			if (confirm('您确定要清空伪禁列表（共' + lib.config.extension_胜负统计_wj.length + '个武将）吗？')) {
				game.saveExtensionConfig('胜负统计', 'wj', []);
				alert('清除成功');
			}
		},
	},
	bd3: {
		name: '<hr>',
		clear: true,
	},
};
