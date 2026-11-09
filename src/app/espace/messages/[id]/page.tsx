import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getSpaceContext } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { Panel } from "@/components/space/ui";
import { SectionLabel } from "@/components/brand/Trace";

export const metadata: Metadata = { title: "Message" };

export default function MessagePage({ params }: PageProps<"/espace/messages/[id]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Message params={params} />
    </Suspense>
  );
}

async function Message({ params }: Pick<PageProps<"/espace/messages/[id]">, "params">) {
  const { user } = await getSpaceContext("/espace/messages");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  // La RLS ne renvoie le message qu'à ses destinataires (et à l'équipe).
  const { data } = await supabase.from("broadcasts").select("title,body,created_at").eq("id", id).maybeSingle();
  if (!data) notFound();
  // Ouvrir le message marque la notification correspondante comme lue.
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).eq("broadcast_id", id).is("read_at", null);

  return (
    <Panel>
      <Link href="/espace/messages" className="link-arrow">
        <ArrowLeft aria-hidden className="size-4" /> Messages
      </Link>
      <div className="mt-8">
        <SectionLabel>Message du secrétariat</SectionLabel>
      </div>
      <h1 className="heading-md mt-4 max-w-3xl">{data.title as string}</h1>
      <p className="mt-2 font-mono text-[0.75rem] text-muted">{formatDateTime(data.created_at as string)}</p>
      <div className="mt-8 max-w-[42rem] space-y-5 border-t border-line pt-8 text-[1.05rem] leading-relaxed whitespace-pre-line text-ink">
        {(data.body as string).split(/\n\s*\n/).map((p, i) => (
          <p key={i}>{p.trim()}</p>
        ))}
      </div>
    </Panel>
  );
}
