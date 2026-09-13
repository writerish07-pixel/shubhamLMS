import { InboxView } from "@/components/inbox-view";

export default async function InboxThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InboxView leadId={id} />;
}
