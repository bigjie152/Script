import { redirect } from "next/navigation";

export const runtime = "edge";

export default async function EditorPage({
  params
}: {
  params: Promise<{ id: string; module: string }>;
}) {
  const resolved = await params;
  redirect(`/projects/${resolved.id}/editor`);
}
