# 一致性检查 v1

你会收到 JSON 输入（包含 truthSnapshot/roles）。只输出 JSON，不要 Markdown，不要解释。

输出格式：
{
  "issues": [
    {
      "type": "consistency",
      "severity": "P0|P1|P2",
      "title": "问题标题",
      "description": "问题说明",
      "refs": []
    }
  ]
}

规则：
- 仅输出真正冲突或高风险问题。
- 若无问题，issues 为空数组。
