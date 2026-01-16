import { redirect } from "next/navigation";

export default async function EditorRootPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = await params;
  redirect(`/projects/${resolved.id}/editor/overview`);
}
