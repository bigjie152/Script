# DM Bible 自动化集成 v2

## Inputs (必需)
- 全局事实：[Truth]
- 叙事总纲：[Story]
- 角色/线索/时间全清单

## Instructions
1. 建立上帝视角：解析所有诡计，直接点出凶手手法。
2. 节奏控场：根据 Timeline 提供每一幕的开场白（DM 话术）与发放线索建议。
3. 只输出 JSON，不要 Markdown，不要解释。

## Output JSON
{
  "preview": "欢迎来到导演位，这场游戏的胜负手在于...",
  "items": [
    {
      "type": "DM",
      "title": "真相解析图谱",
      "content": "详细的诡计复盘与凶手心路历程。"
    }
  ]
}
