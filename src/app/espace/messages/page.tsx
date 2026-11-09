import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { Panel, SpaceHeader } from "@/components/space/ui";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Messages />
    </Suspense>
  );
}

async function Messages() {
  const { user } = await getSpaceContext("/espace/messages");
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id,title,body,read_at,created_at,broadcast_id")
    .eq("user_id", user.id)
    .eq("type", "broadcast")
    .order("created_at", { ascending: false })
    .limit(100);
  const items = data ?? [];
  return (
    <>
      <SpaceHeader label="Messages" title="Messages du secrétariat" description="Informations et alertes adressées aux membres du réseau." />
      <Panel className="mt-8 p-0 sm:p-0">
        {items.length ? (
          <ul>
            {items.map((m) => (
              <li key={m.id as string} className="border-b border-line last:border-b-0">
                <Link href={`/espace/messages/${m.broadcast_id}`} className="group grid grid-cols-[1rem_1fr] gap-4 px-6 py-5 transition-colors hover:bg-paper sm:px-8">
                  <span aria-hidden className={`mt-1.5 size-2.5 rounded-full border-2 ${m.read_at ? "border-line-strong" : "border-cyan bg-cyan"}`} />
                  <span>
                    <span className={`block ${m.read_at ? "text-navy/80" : "font-semibold text-navy"} group-hover:text-cyan-dark`}>{m.title as string}</span>
                    {m.body && <span className="mt-1 line-clamp-2 block text-[0.92rem] text-muted">{m.body as string}</span>}
                    <span className="mt-1.5 block font-mono text-[0.72rem] text-muted">{formatDateTime(m.created_at as string)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-muted">Aucun message pour le moment.</p>
        )}
      </Panel>
    </>
  );
}
