# 线索生成 v1

你会收到 JSON 输入（包含 truthSnapshot 等）。只输出 JSON，不要 Markdown，不要解释。

输出格式：
{
  "items": [
    {
      "title": "线索名",
      "summary": "一句话摘要",
      "content": {
        "type": "doc",
        "content": [
          { "type": "paragraph", "content": [{ "type": "text", "text": "线索描述" }] }
        ]
      },
      "refs": [],
      "risk_flags": []
    }
  ]
}

规则：
- items 建议 1~3 条。
- content 必须是 TipTap doc。
- 不得违反 Truth。
