export function extractJson<T>(input: string): T | null {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)
    || trimmed.match(/```([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {
      // continue
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(candidate) as T;
    } catch {
      return null;
    }
  }

  return null;
}
