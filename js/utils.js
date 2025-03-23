import { lib, game, ui, get, ai, _status } from '../../../noname.js';
import security from '../../../noname/util/security.js';

/**
 * 复制文本内容到剪贴板
 * @param { string } text - 要复制的文本
 * @param { string | false } [success] - 成功提示语
 * @param { string | false } [fail] - 失败提示语
 * @returns { boolean }
 */
game.copy = (text, success = '已成功复制到剪贴板', fail = '复制失败') => {
	if (typeof text !== 'string') return;
	let copied = false;
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.style.position = 'fixed';
	textarea.style.left = '-9999px';
	textarea.style.width = '1px';
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();
	try {
		copied = document.execCommand('copy');
		if (copied) {
			success && alert(success);
		} else {
			fail && alert(fail);
		}
	} catch (e) {
		console.error('execCommand失败:', e);
		fail && alert(fail);
	}
	document.body.removeChild(textarea);
	return copied;
};

/**
 * 胜负统计刷新记录函数
 * @param { string } [sf] 要刷新的配置
 * @param { boolean } [redraw] 是否刷新显示，默认不刷新
 */
game.sfRefresh = (sf, redraw = false) => {
	let cgns;
	if (typeof sf !== 'string') cgns = get.sfConfigName();
	else cgns = [sf];
	for (let sf of cgns) {
		if (Object.prototype.toString.call(lib.config[sf]) !== '[object Object]') lib.config[sf] = {};
		for (let i in lib.config[sf]) {
			let all = lib.config[sf][i].win + lib.config[sf][i].lose;
			if (all) lib.config[sf][i].sl = lib.config[sf][i].win / all;
			else {
				delete lib.config[sf][i];
				continue;
			}
			if (redraw && lib.config.extension_胜负统计_display !== 'off') {
				if (lib.characterTitle[i] === undefined) lib.characterTitle[i] = '';
				else lib.characterTitle[i] += '<br>';
				lib.characterTitle[i] += get.identityInfo(sf) + '<br>';
				if (lib.config.extension_胜负统计_display !== 'sf')
					lib.characterTitle[i] += '总场数：' + all + '<br>胜率：' + Math.round(100000 * lib.config[sf][i].sl) / 1000 + '%<br>';
				if (lib.config.extension_胜负统计_display !== 'sl')
					lib.characterTitle[i] += lib.config[sf][i].win + '胜 ' + lib.config[sf][i].lose + '负<br>';
			}
		}
		game.saveConfig(sf, lib.config[sf]);
	}
};

/**
 * 获取当前游戏模式名称
 * @param { true } [sf] - 胜负统计专用
 * @returns { string }
 */
get.currentModeInfo = (sf) => {
	let info = lib.translate[get.mode()];
	if (_status.mode && (!sf || lib.config.extension_胜负统计_apart)) {
		let sm;
		switch (get.mode()) {
			case 'identity':
				if (_status.mode === 'normal') sm = '标准';
				else if (_status.mode === 'zhong') sm = '明忠';
				else if (_status.mode === 'purple') sm = '3v3v2';
				break;
			case 'guozhan':
				if (_status.mode === 'normal') sm = '势备';
				else if (_status.mode === 'yingbian') sm = '应变';
				else if (_status.mode === 'old') sm = '怀旧';
				else if (_status.mode === 'free') sm = '自由';
				break;
			case 'versus':
				if (_status.mode === 'four') sm = '对抗';
				else if (_status.mode === 'three') sm = '统率';
				else if (_status.mode === 'two') sm = '欢乐';
				else if (_status.mode === 'guandu') sm = '官渡';
				else if (_status.mode === 'jiange') sm = '剑阁';
				else if (_status.mode === 'siguo') sm = '四国';
				else if (_status.mode === 'standard') sm = '自由';
				break;
			case 'doudizhu':
				if (_status.mode === 'normal') sm = '休闲';
				else if (_status.mode === 'kaihei') sm = '开黑';
				else if (_status.mode === 'huanle') sm = '欢乐';
				else if (_status.mode === 'binglin') sm = '兵临';
				else if (_status.mode === 'online') sm = '智斗';
				break;
			case 'single':
				lib.translate[_status.mode + '2'];
				break;
			case 'chess':
				if (_status.mode === 'combat') sm = '自由';
				else if (_status.mode === 'three') sm = '统率';
				else if (_status.mode === 'leader') sm = '君主';
				break;
		}
		if (sm) info += ' - ' + sm;
	}
	return info + '模式';
};

/**
 * 获取字符串中最后一个'_'后面的身份翻译
 * @param { string } str - 待清洗字符串
 * @param { string } [none] - 不存在则返回指定内容
 * @returns { string }
 */
get.identityInfo = (str, none) => {
	let res = '';
	if (none) res = none;
	if (typeof str !== 'string') return res;
	let clean = str.split('_');
	if (get.sfConfigName().length <= 1) return res;
	clean = clean[clean.length - 1];
	if (clean.indexOf('unknown') === 0) return res || '未知';
	if (isNaN(parseInt(clean[clean.length - 1]))) clean += '2';
	let trans = lib.translate[clean];
	if (typeof trans !== 'string') return res;
	return trans;
};

/**
 * 筛选至少min场的胜负记录
 * @param { Record<string, { win: number; lose: number; sl?: number }> } config - 胜负记录字典
 * @param { number } min - 最小场次要求
 * @returns { Record<string, { win: number; lose: number; sl?: number }> } 过滤后的胜负记录字典
 */
get.purifySFConfig = (config, min) => {
	if (Object.prototype.toString.call(config) !== '[object Object]') {
		alert('config ' + config + '不为[object Object]类型');
		return config;
	}
	if (typeof min !== 'number' || isNaN(min)) min = 0;
	let result = {},
		judge = false;
	for (let i in config) {
		if (!judge) {
			if (Object.prototype.toString.call(config[i]) !== '[object Object]') return config;
			judge = true;
		}
		if (config[i].win + config[i].lose >= min) result[i] = config[i];
	}
	return result;
};

/**
 * 获取当前游戏模式下武将的胜负统计配置名
 * @overload
 * @returns { string[] } 返回所有可能的身份配置名数组
 */
/**
 * 获取当前游戏模式下武将对应身份的胜负统计配置名
 * @overload
 * @param { string } identity - 身份
 * @returns { string } 返回当前游戏模式胜负统计对应身份配置名
 */
get.sfConfigName = (identity) => {
	let mode = get.mode(),
		cgn = 'extension_胜负统计_' + mode,
		sm = '';
	if (_status.mode && lib.config.extension_胜负统计_apart && _status.mode !== 'deck') sm = '_' + _status.mode;
	if (typeof identity !== 'string') {
		if (mode === 'identity') {
			if (_status.mode === 'purple') return [cgn + sm + '_rZhu', cgn + sm + '_rZhong', cgn + sm + '_rNei', cgn + sm + '_rYe'];
			let configs = [];
			configs.addArray([cgn + sm + '_zhu', cgn + sm + '_zhong', cgn + sm + '_fan', cgn + sm + '_nei']);
			if (_status.mode === 'zhong') configs.push(cgn + sm + '_mingzhong');
			return configs;
		}
		if (mode === 'doudizhu' || mode === 'single') return [cgn + sm + '_zhu', cgn + sm + '_fan'];
		return [cgn + sm];
	}
	if (mode === 'identity' && _status.mode === 'purple') return cgn + sm + '_r' + identity.slice(1);
	if (mode === 'identity' || mode === 'doudizhu' || mode === 'single') return cgn + sm + '_' + identity;
	return cgn + sm;
};

/**
 * @overload
 * 获取当前游戏模式下name对应identity身份的胜率
 * @param { string | Player } name - 武将ID/角色
 * @param { string } [identity] - 筛选身份
 * @param { number | 'avg' | 'max' | 'min' } [strategy] - 胜率计算方案
 *
 * number: 没有对应胜率则取该值
 *
 * 'avg': 获取主将和副将胜率的平均值，无副将或没有对应胜率则按0.5计算取平均
 *
 * 'max': 获取主将和副将中胜率较高的，无副将或没有对应胜率则取1
 *
 * 'min': 获取主将和副将中胜率较低的，无副将或没有对应胜率则取0
 *
 * other: 直接返回主将胜率，无则返回0.5
 * @returns { number }
 */
/**
 * @overload
 * 获取当前游戏模式下name所有身份的胜率
 * @param { string | Player } name - 武将ID/角色
 * @param { 'all' } identity - 筛选身份
 * @param { number | 'avg' | 'max' | 'min' } [strategy] - 胜率计算方案
 *
 * number: 没有对应胜率则取该值
 *
 * 'avg': 获取主将和副将胜率的平均值，无副将或没有对应胜率则按0.5计算取平均
 *
 * 'max': 获取主将和副将中胜率较高的，无副将或没有对应胜率则取1
 *
 * 'min': 获取主将和副将中胜率较低的，无副将或没有对应胜率则取0
 *
 * other: 直接返回主将胜率，无则返回0.5
 * @returns { Record<string, number> }
 */
get.SL = (name, identity, strategy) => {
	let name1 = 'unknown',
		name2,
		result = {};
	if (typeof identity !== 'string') {
		if (get.itemtype(name) === 'player') identity = name.identity;
		else {
			console.error('get.SL: identity是一个无效传参！', identity);
			return NaN;
		}
	}
	const configNames = identity === 'all' ? get.sfConfigName() : [get.sfConfigName(identity)];
	if (get.itemtype(name) === 'player') {
		if (typeof name.name1 === 'string') name1 = name.name1;
		if (typeof name.name2 === 'string') name2 = name.name2;
	} else if (typeof name === 'string') name1 = name;
	let num1 = 0.5,
		num2 = -1;
	if (typeof strategy === 'number') num2 = strategy;
	else if (strategy === 'avg') num2 = 0.5;
	else if (strategy === 'max') num2 = 1;
	else if (strategy === 'min') num2 = 0;
	for (let cgn of configNames) {
		let zhu = lib.config[cgn][name1]?.sl;
		if (typeof zhu !== 'number') {
			if (num2 >= 0) zhu = num2;
			else zhu = num1;
		}
		if (name2) {
			let fu = lib.config[cgn][name2]?.sl;
			if (typeof fu !== 'number') {
				if (num2 >= 0) fu = num2;
				else console.error('get.SL: 没有为双将胜率指定计算方案或参考值', strategy);
			}
			if (strategy === 'avg') zhu = (zhu + fu) / 2;
			else if (strategy === 'max') zhu = Math.max(zhu, fu);
			else if (strategy === 'min') zhu = Math.min(zhu, fu);
		}
		if (identity === 'all') result[get.identityInfo(cgn, '不明身份')] = zhu;
		else return zhu;
	}
	return result;
};

/**
 * 伪连接字符串，去掉换行和两端空串
 * @param { TemplateStringsArray } strings 模板字符串
 * @param { ...any } values 插值
 * @returns { string }
 */
ui.joint = function (strings, ...values) {
	let str = strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
	let lines = str.split('\n').map((line) => line.trimStart());
	return lines.join('').trim();
};

export { lib, game, ui, get, ai, _status, security };
