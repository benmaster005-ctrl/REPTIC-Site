import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { formatAmount, verifyAndRecord } from "@/lib/payments";
import { Panel } from "@/components/space/ui";
import { SectionLabel } from "@/components/brand/Trace";

export const metadata: Metadata = { title: "Paiement de la cotisation" };

/** Retour du membre depuis la page de paiement : le statut est revérifié auprès du prestataire. */
export default function ReturnPage({ searchParams }: PageProps<"/espace/cotisation/retour">) {
  return (
    <Suspense fallback={<div aria-busy className="h-72 animate-pulse bg-white" />}>
      <Result searchParams={searchParams} />
    </Suspense>
  );
}

async function Result({ searchParams }: Pick<PageProps<"/espace/cotisation/retour">, "searchParams">) {
  const { user } = await getSpaceContext("/espace/cotisation");
  const { ref } = await searchParams;
  const reference = typeof ref === "string" && /^COT-\d{4}-[A-F0-9]{8}$/.test(ref) ? ref : null;
  const supabase = await createClient();
  const { data: pay } = reference
    ? await supabase.from("payments").select("reference,year,amount,currency,status").eq("reference", reference).eq("user_id", user.id).maybeSingle()
    : { data: null };

  let status = (pay?.status as string) ?? "unknown";
  if (pay && status !== "paid") status = (await verifyAndRecord(reference!)).status;

  const view =
    status === "paid"
      ? { tone: "border-cyan", title: "Paiement confirmé, merci !", text: `Votre cotisation ${pay?.year} est réglée. Un e-mail de confirmation vous a été envoyé et votre reçu est disponible.` }
      : status === "failed" || status === "cancelled"
        ? { tone: "border-red-600", title: "Le paiement n'a pas abouti", text: "Aucun montant n'a été débité. Vous pouvez réessayer depuis la page Cotisation." }
        : status === "pending"
          ? { tone: "border-amber-500", title: "Paiement en cours de confirmation", text: "Votre opérateur n'a pas encore confirmé la transaction (cela peut prendre quelques minutes pour le Mobile Money). Cette page se met à jour : actualisez-la dans un instant." }
          : { tone: "border-line-strong", title: "Paiement introuvable", text: "Retournez sur la page Cotisation pour vérifier l'état de vos paiements." };

  return (
    <Panel>
      <SectionLabel>Cotisation{pay ? ` ${pay.year}` : ""}</SectionLabel>
      <div className={`mt-6 max-w-2xl border-l-[3px] pl-6 ${view.tone}`}>
        <h1 className="heading-md">{view.title}</h1>
        {pay && <p className="mt-2 font-mono text-[0.8rem] text-muted">{pay.reference as string} · {formatAmount(pay.amount as number, pay.currency as string)}</p>}
        <p className="mt-4 text-[1rem] text-ink">{view.text}</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        {status === "paid" && pay ? (
          <Link href={`/espace/cotisation/recu/${pay.reference}`} className="btn-primary">
            Voir mon reçu
          </Link>
        ) : status === "pending" && pay ? (
          <Link href={`/espace/cotisation/retour?ref=${pay.reference}`} className="btn-primary">
            Actualiser
          </Link>
        ) : null}
        <Link href="/espace/cotisation" className="btn-secondary">
          Page Cotisation
        </Link>
      </div>
    </Panel>
  );
}
