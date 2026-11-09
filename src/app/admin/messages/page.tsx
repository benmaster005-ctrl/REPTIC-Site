import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requirePermission } from "@/lib/admin";
import { PAGE_SIZE, listMessages } from "@/lib/data/admin";
import { toggleMessageHandled } from "@/app/actions/admin-content";
import { formatDateTime } from "@/lib/format";
import { AdminHeader, Pagination, Panel, listHref, pageNum } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Messages de contact" };

export default function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Messages searchParams={searchParams} />
    </Suspense>
  );
}

async function Messages({ searchParams }: Pick<PageProps<"/admin/messages">, "searchParams">) {
  await requirePermission("contact.manage");
  const p = await searchParams;
  const handled = p.traites === "1";
  const page = pageNum(p.page);
  const { rows, total } = await listMessages({ handled, page });
  return (
    <>
      <AdminHeader label="Relations" title="Messages de contact" description="Messages envoyés depuis le formulaire du site." />
      <div className="mt-8 flex border-b border-line">
        {[
          { href: "/admin/messages", label: "À traiter", active: !handled },
          { href: "/admin/messages?traites=1", label: "Traités", active: handled },
        ].map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.active ? "page" : undefined} className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${t.active ? "border-cyan text-navy" : "border-transparent text-muted hover:text-navy"}`}>
            {t.label}
          </Link>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {rows.map((m) => (
          <Panel key={m.id as string}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-[1.1rem] font-bold text-navy">{m.subject as string}</p>
                <p className="mt-1 text-[0.88rem] text-muted">
                  {m.full_name as string} ·{" "}
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re : ${m.subject}`)}`} className="font-semibold text-navy hover:text-cyan-dark">
                    {m.email as string}
                  </a>
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
              </div>
              <p className="font-mono text-[0.72rem] text-muted">{formatDateTime(m.created_at as string)}</p>
            </div>
            <p className="mt-4 text-[0.95rem] whitespace-pre-line text-ink">{m.message as string}</p>
            <form action={toggleMessageHandled} className="mt-5 flex gap-3 border-t border-line pt-4">
              <input type="hidden" name="id" value={m.id as string} />
              <input type="hidden" name="handled" value={handled ? "0" : "1"} />
              <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re : ${m.subject}`)}`} className="btn-primary px-4 py-2 text-[0.85rem]">
                Répondre par e-mail
              </a>
              <button type="submit" className="btn-secondary px-4 py-2 text-[0.85rem]">
                {handled ? "Remettre à traiter" : "Marquer comme traité"}
              </button>
            </form>
          </Panel>
        ))}
        {!rows.length && (
          <Panel>
            <p className="text-muted">{handled ? "Aucun message traité." : "Aucun message en attente."}</p>
          </Panel>
        )}
      </div>
      <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} href={(n) => listHref("/admin/messages", { traites: handled ? "1" : undefined, page: n > 1 ? String(n) : undefined })} />
    </>
  );
}
