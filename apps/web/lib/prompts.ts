const PROMPTS: Record<string, string> = {
  "derive/role.v1.md": "你是角色生成助手。只输出 JSON。",
  "derive/story.v1.md": "你是剧本叙事生成助手。只输出 JSON。",
  "derive/clue.v1.md": "你是线索生成助手。只输出 JSON。",
  "derive/timeline.v1.md": "你是时间线生成助手。只输出 JSON。",
  "derive/dm.v1.md": "你是 DM 手册生成助手。只输出 JSON。",
  "derive/outline.v1.md": "你是剧本构思助手。只输出 JSON。",
  "derive/worldcheck.v1.md": "你是世界观合理性检查助手。只输出 JSON。",
  "check/consistency.v1.md":
    "你是事实一致性检查助手。只输出 JSON。",
  "check/logic.v1.md": "你是逻辑审查助手。只输出 JSON。"
};

export async function loadPrompt(relativePath: string) {
  const key = relativePath.replace(/^[\\/]+/, "");
  return PROMPTS[key] || "";
}
