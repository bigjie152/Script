import { redirect } from "next/navigation";

export default function EditorRootPage({
  params
}: {
  params: { id: string };
}) {
  redirect(`/projects/${params.id}/editor/overview`);
}
