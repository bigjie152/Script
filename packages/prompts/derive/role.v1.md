# 角色生成 v1

你会收到 JSON 输入（包含 truthSnapshot 等）。只输出 JSON，不要 Markdown，不要解释。

输出格式：
{
  "roles": [
    {
      "name": "角色名",
      "summary": "一句话人物动机/背景摘要",
      "meta": {}
    }
  ]
}

规则：
- 严格基于 Truth/Story/Context，不新增与事实冲突的内容。
- 角色名尽量简短可辨识。
- 若无法推断，返回空数组。
