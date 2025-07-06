import { lib, game, ui, get, ai, _status } from './utils.js';

export function arenaReady() {
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
}
