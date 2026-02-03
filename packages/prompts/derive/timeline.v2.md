# Timeline 结构节点提取 v2

## Inputs (必需)
- 事实源：[Truth]
- 叙事源：[Story]

## Instructions
1. 从上述文档中提取所有关键的时间点节点。
2. 识别每一个时间点下所有角色的具体位置与行为状态。
3. 每个 items 对应一个时间节点，title 必须包含时间点（例如 18:00 / T-1 18:00）。
4. 只输出 JSON，不要 Markdown，不要解释。

## Output JSON
{
  "preview": "我们为您梳理了从案发前 3 小时到现场发现的完整时空网络...",
  "items": [
    {
      "type": "Timeline",
      "title": "[18:00] 节点事件",
      "content": "描述在该时间点发生的物理事实，标注涉及的 @角色。",
      "meta": { "time": "18:00", "is_alibi_node": true }
    }
  ]
}
