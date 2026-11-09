import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { formatAmount, isDemoPayment } from "@/lib/payments";
import { simulateDemoPayment } from "@/app/actions/payments";
import { Panel } from "@/components/space/ui";

export const metadata: Metadata = { title: "Paiement (démonstration)", robots: { index: false } };

/** Simulateur de page de paiement, actif uniquement avec PAYMENT_PROVIDER=demo. */
export default function DemoPaymentPage({ searchParams }: PageProps<"/espace/cotisation/demo">) {
  return (
    <Suspense fallback={<div aria-busy className="h-72 animate-pulse bg-white" />}>
      <Demo searchParams={searchParams} />
    </Suspense>
  );
}

async function Demo({ searchParams }: Pick<PageProps<"/espace/cotisation/demo">, "searchParams">) {
  if (!isDemoPayment) notFound();
  const { user } = await getSpaceContext("/espace/cotisation");
  const { ref } = await searchParams;
  const reference = typeof ref === "string" ? ref : "";
  const supabase = await createClient();
  const { data: pay } = await supabase.from("payments").select("reference,year,amount,currency,status").eq("reference", reference).eq("user_id", user.id).maybeSingle();
  if (!pay) notFound();

  return (
    <Panel className="mx-auto max-w-lg border-t-4 border-amber-500">
      <p className="font-mono text-[0.75rem] tracking-[0.08em] text-amber-700 uppercase">Simulateur · aucun paiement réel</p>
      <h1 className="heading-md mt-3">Page de paiement</h1>
      <dl className="mt-6 border-t-2 border-navy text-[0.95rem]">
        <div className="flex justify-between border-b border-line py-3">
          <dt className="text-muted">Bénéficiaire</dt>
          <dd className="font-semibold text-navy">REPTIC.CM</dd>
        </div>
        <div className="flex justify-between border-b border-line py-3">
          <dt className="text-muted">Objet</dt>
          <dd className="font-semibold text-navy">Cotisation {pay.year as number}</dd>
        </div>
        <div className="flex justify-between border-b border-line py-3">
          <dt className="text-muted">Montant</dt>
          <dd className="font-semibold text-navy">{formatAmount(pay.amount as number, pay.currency as string)}</dd>
        </div>
      </dl>
      {pay.status === "pending" ? (
        <form action={simulateDemoPayment} className="mt-8 flex flex-wrap gap-3">
          <input type="hidden" name="ref" value={pay.reference as string} />
          <button type="submit" name="outcome" value="paid" className="btn-primary">
            Simuler un paiement réussi
          </button>
          <button type="submit" name="outcome" value="failed" className="btn-secondary">
            Simuler un échec
          </button>
        </form>
      ) : (
        <p className="mt-8 text-muted">Ce paiement est déjà traité ({pay.status as string}).</p>
      )}
    </Panel>
  );
}
