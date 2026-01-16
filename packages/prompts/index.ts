import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

export async function loadPrompt(relativePath: string) {
  const candidates = [
    path.resolve(process.cwd(), "..", "..", "packages", "prompts"),
    path.resolve(process.cwd(), "packages", "prompts")
  ];
  const baseDir =
    candidates.find((candidate) => existsSync(candidate)) || candidates[0];
  const filePath = path.resolve(baseDir, relativePath);
  return readFile(filePath, "utf8");
}
