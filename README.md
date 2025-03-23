# 胜负统计

[![GPL3.0 License](https://img.shields.io/badge/License-GPL3.0-green.svg)](https://opensource.org/licenses/) 
_本扩展需在[无名杀](https://github.com/libnoname/noname)环境中使用_

## ✨ 扩展简介

整合『AI优化』『官将重修』部分功能的扩展，提供以下核心功能：

- 📊 全模式武将胜负场次统计
- 🏆 实时胜率排行榜展示
- 🆔 同名武将去重机制
- 🤖 伪·玩家可选AI禁选系统
- 🔧 支持通过`get.SL()`接口获取角色胜率

## 📦 使用状态

- **开发状态**: 已完结
- **授权范围**: 非盈利场景下可自由分享/修改/移植

## ⚙️ 使用须知

### 核心设置

◆ 模式区分开关：开启/关闭「区分当前游戏模式」时记录的胜率数据相互独立

★ 魏体字功能需重启生效

### 模式特性

■ 身份/斗地主/单挑模式：按身份/先后手独立统计

■ 对决模式：因技术问题，记录不区分先后手/冷暖方

■ 挑战模式：不记录随从

### 特殊说明

● 武将变更检测：仅记录开局/结束时的场上武将

● 全场记录机制

   - 基于模式基础机制实现
   - OL董昭等修改原有机制的对局可能出现误录（建议关闭或开启「其他阵营视为同一阵营」）

## 📤 数据管理

◈ 复制记录：请及时将复制的记录粘贴保存

◈ 载入记录

   - 完全替换原有记录（非增量更新）
   - 必须严格遵循原有数据格式

## 🛠 开发者接口

### get.SL() 使用示例

```javascript
lib.skill.dragon_longlie = {
	enable: 'phaseUse',
	filter(event, player) {
		return !player.getStat('skill').longlie;
	},
	filterTarget: lib.filter.notMe,
	prompt: '选择一名其他角色，然后有概率对其造成2点火焰伤害（其胜率越高概率越大，无记录则默认50%）',
	async content(event, trigger, player) {
		const target = event.targets[0];
		if(Math.random() < get.SL(target)) { // 获取目标胜率进行概率判定
			await target.damage(player, 2, 'fire', 'nocard');
		}
	},
	ai: {
		order: 12,
		fireAttack: true,
		result: {
			target(player, target) {
				let num = target.hasSkillTag('filterDamage', null, {
					player,
					card: null
				}) ? 10 : 5;
				return get.SL(target) * get.damageEffect(target, player, target, 'fire') / num;
			}
		}
	}
};
```

### 高级用法

```javascript
// 获取某武将全身份胜率字典
const winRateDict = get.SL('武将ID', 'all'); 
// 返回值示例: { '主公': 0.65, '忠臣': 0.58, ... }
```

---

> 📌 **移植声明**：本扩展采用GPL3.0协议，任何二次开发/修改版本需保持协议一致性
