# 线索实体映射（Clue Synthesis）v2

## Inputs (必需)
- 事实源：[Truth]
- 叙事源：[Story]

## Instructions
1. 物证化：将 Story 中提到的物品转化为线索卡。
2. 证据链对齐：每一条核心线索必须能对应 Truth 中的一个事实。
3. 只输出 JSON，不要 Markdown，不要解释。

## Output JSON
{
  "preview": "现场残留的证据正在低语，我们为您发现了 12 处疑点...",
  "items": [
    {
      "type": "Clue",
      "title": "#线索名",
      "content": "具有画面感的描述。附带搜证等级要求。",
      "meta": { "truth_link": "指向真相中的第 N 条", "is_trap": false }
    }
  ]
}
