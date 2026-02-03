# Story 叙事总纲生成 v2

## Inputs (必需)
- 锁定事实：[Truth 内容]

## Instructions
1. 将 Truth 的冰冷事实，转化为具备“灰烬工作室”风格的、极具张力的文学叙事。
2. 明确标注出哪些是“误导（Red Herring）”，哪些是“情感钩子”。
3. 只输出 JSON，不要 Markdown，不要解释。
4. items 只能 1 条；content 输出三幕式（往事/案发/结局）且必须使用 @角色 语法。

## Output JSON
{
  "preview": "故事发生在一个[环境描述]的地方，六名各怀鬼胎的人聚在一起...",
  "items": [
    {
      "type": "Story",
      "title": "文学复盘总纲",
      "content": "输出包含往事、案发、结局三幕式的完整文学性复盘内容。必须使用 @角色 语法，并标注误导与情感钩子。"
    }
  ]
}
