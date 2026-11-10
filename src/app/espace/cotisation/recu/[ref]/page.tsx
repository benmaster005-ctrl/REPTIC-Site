import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getSpaceContext, displayName } from "@/lib/space";
import { createClient } from "@/lib/supabase/server";
import { getMyMember } from "@/lib/data/member";
import { formatAmount } from "@/lib/payments";
import { formatDate, formatDateTime } from "@/lib/format";
import { getSiteSettings } from "@/lib/data/public";
import { PrintButton } from "@/components/space/PrintButton";

export const metadata: Metadata = { title: "Reçu de cotisation", robots: { index: false } };

export default function ReceiptPage({ params }: PageProps<"/espace/cotisation/recu/[ref]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Receipt params={params} />
    </Suspense>
  );
}

async function Receipt({ params }: Pick<PageProps<"/espace/cotisation/recu/[ref]">, "params">) {
  const { user } = await getSpaceContext("/espace/cotisation");
  const { ref } = await params;
  const supabase = await createClient();
  const [{ data: pay }, member, { contact }] = await Promise.all([
    supabase.from("payments").select("reference,year,amount,currency,status,payment_method,provider_transaction_id,paid_at").eq("reference", ref).eq("user_id", user.id).maybeSingle(),
    getMyMember(user.id),
    getSiteSettings(),
  ]);
  if (!pay || pay.status !== "paid") notFound();
  const holder = member?.organizationName ?? displayName(user);

  const rows = [
    ["Reçu n°", pay.reference as string],
    ["Membre", holder],
    ["Numéro de membre", member?.memberNumber ?? "—"],
    ["Objet", `Cotisation annuelle ${pay.year} (du 1er janvier au 31 décembre ${pay.year})`],
    ["Montant réglé", formatAmount(pay.amount as number, pay.currency as string)],
    ["Moyen de paiement", (pay.payment_method as string) ?? "Paiement en ligne (CinetPay)"],
    ["Transaction", (pay.provider_transaction_id as string) ?? "—"],
    ["Date du paiement", formatDateTime(pay.paid_at as string)],
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/espace/cotisation" className="link-arrow">
          <ArrowLeft aria-hidden className="size-4" /> Cotisation
        </Link>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-2xl border-t-4 border-navy bg-white p-8 sm:p-12 print:max-w-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight text-navy">
              REPTIC<span className="text-cyan">.cm</span>
            </p>
            <p className="mt-1 max-w-xs text-[0.72rem] leading-snug text-muted">Réseau des Entreprises &amp; Professionnels du Secteur des Télécoms et du Numérique au Cameroun</p>
          </div>
          <div className="text-right">
            <p className="label">Reçu de cotisation</p>
            <p className="mt-1 font-mono text-[0.85rem] text-navy">{pay.reference as string}</p>
          </div>
        </header>
        <dl className="mt-6">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[minmax(9rem,38%)_1fr] gap-4 border-b border-line py-3 text-[0.95rem]">
              <dt className="text-muted">{k}</dt>
              <dd className="font-semibold break-words text-navy">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-[0.85rem] text-muted">
          Le REPTIC.CM atteste avoir reçu la somme ci-dessus au titre de la cotisation annuelle. Document généré le {formatDate(new Date().toISOString())}.
        </p>
        <footer className="mt-8 border-t border-line pt-4 text-[0.75rem] text-muted">
          REPTIC.CM · {contact.address} · {contact.email} · {contact.phone}
        </footer>
      </article>
    </>
  );
}
