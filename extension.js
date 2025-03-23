//game.import(name:"胜负统计"
import { lib, game, ui, get, ai, _status } from './js/utils.js';
import { config } from './js/config.js';
import { content } from './js/content.js';
import { precontent } from './js/precontent.js';

let extensionPackage = {
	name: '胜负统计',
	content,
	precontent,
	config,
	help: {},
	package: {
		intro: ui.joint`
			<b>本扩展主要用于统计每个武将各模式各身份的胜负</b>
			<br><br><font color=#FF3300>注意：本扩展</font>内，
			<br>◆以下<span style="font-family: xinwei">魏体</span>选项均<font color=#70F3FF>重启后生效</font>！
				其余选项<font color=#FF3300>即时生效</font>
			<br>◆<font color=#70F3FF>长按选项</font>有提示
		`,
	},
	files: { character: [], card: [], skill: [] },
};
const extensionInfo = await lib.init.promises.json(`${lib.assetURL}extension/胜负统计/info.json`);
Object.keys(extensionInfo).forEach((key) => {
	if (key !== 'intro') extensionPackage.package[key] = extensionInfo[key];
});

export let type = 'extension';
export default extensionPackage;
