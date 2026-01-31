# 逻辑审查 v1

你会收到 JSON 输入（包含 truthSnapshot/context）。只输出 JSON，不要 Markdown，不要解释。

输出格式：
{
  "issues": [
    {
      "type": "logic_check",
      "severity": "P0|P1|P2",
      "title": "问题标题",
      "description": "问题说明",
      "refs": []
    }
  ]
}

规则：
- P0：硬逻辑冲突（时间线冲突/Truth 冲突/视角污染）。
- P1：重要缺失或可导致跑偏的问题。
- P2：改进建议类。
- 若无问题，issues 为空数组。
