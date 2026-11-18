import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { AdminPageBoundary } from "@/components/admin/AdminUI";


export default function ExamplePage(props: PageProps<"/admin/disenos/[id]">) {
  return <AdminPageBoundary><ExamplePageData {...props} /></AdminPageBoundary>;
}

async function ExamplePageData({ params, searchParams }: PageProps<"/admin/disenos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [query, example] = await Promise.all([searchParams, prisma.showcaseExample.findUnique({ where: { id }, select: { id: true } })]);
  if (!example) notFound();
  const notice = new URLSearchParams();
  if (typeof query.saved === "string") notice.set("saved", query.saved);
  if (typeof query.error === "string") notice.set("error", query.error);
  return redirect(`/admin/disenos${notice.size ? `?${notice}` : ""}`);
}
