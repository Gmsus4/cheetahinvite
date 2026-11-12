import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin-access";
import { prisma } from "@/prisma";
import { AdminPageBoundary, AdminHeading, AdminNotice } from "@/components/admin/AdminUI";
import { ExampleSettings } from "@/components/admin/ExampleSettings";
import { ExampleRefreshOnReturn } from "@/components/admin/ExampleRefreshOnReturn";
import styles from "../../compact.module.css";

export default function ExamplePage(props: PageProps<"/admin/disenos/[id]">) {
  return <AdminPageBoundary><ExamplePageData {...props} /></AdminPageBoundary>;
}

async function ExamplePageData({ params, searchParams }: PageProps<"/admin/disenos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [query, example] = await Promise.all([searchParams, prisma.showcaseExample.findUnique({ where: { id }, include: { event: { select: { contentVersion: true } } } })]);
  if (!example) notFound();
  return <div className={styles.compact}>
    <ExampleRefreshOnReturn />
    <Link href="/admin/disenos" className="admin-inline admin-help"><FiArrowLeft />Todos los ejemplos</Link>
    <div style={{ marginTop: 24 }}><AdminHeading title={example.label} description="Administra la presentación y publicación de tu ejemplo." /></div>
    <AdminNotice success={query.saved} error={query.error} />
    <ExampleSettings example={example} />
  </div>;
}
