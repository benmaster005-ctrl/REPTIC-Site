import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CreditCard, Smartphone } from "lucide-react";
import { getSpaceContext } from "@/lib/space";
import { getFeeOverview, getMyMember, payableYears } from "@/lib/data/member";
import { formatAmount, isDemoPayment, isPaymentEnabled } from "@/lib/payments";
import { startFeePayment } from "@/app/actions/payments";
import { formatDate } from "@/lib/format";
import { MembersOnly, Panel, SpaceFlash, SpaceHeader, StatusTag } from "@/components/space/ui";
import { SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "Cotisation" };

const statusTag = {
  paid: ["Payée", "success"],
  pending: ["En attente", "info"],
  failed: ["Échouée", "danger"],
  cancelled: ["Abandonnée", "neutral"],
} as const;

export default function FeePage({ searchParams }: PageProps<"/espace/cotisation">) {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Fee searchParams={searchParams} />
    </Suspense>
  );
}

async function Fee({ searchParams }: Pick<PageProps<"/espace/cotisation">, "searchParams">) {
  const { user, isMember } = await getSpaceContext("/espace/cotisation");
  if (!isMember) return (<><SpaceHeader label="Cotisation" title="Ma cotisation" /><MembersOnly feature="Le paiement de la cotisation" /></>);
  const [{ erreur }, member] = await Promise.all([searchParams, getMyMember(user.id)]);
  const overview = await getFeeOverview(user.id, member?.memberType ?? null);
  const years = payableYears();
  const due = years.filter((y) => !overview.paidYears.has(y));
  const amount = overview.fee?.amount ?? null;

  return (
    <>
      <SpaceHeader label="Cotisation" title="Ma cotisation" description="La cotisation couvre l'année civile (du 1er janvier au 31 décembre) et renouvelle votre adhésion." />
      {erreur && (
        <SpaceFlash tone="error">
          {erreur === "indisponible"
            ? "Le paiement en ligne n'est pas encore disponible."
            : erreur === "prestataire"
              ? "Le service de paiement n'a pas pu être joint. Réessayez dans quelques minutes."
              : erreur === "creation"
                ? "Le paiement n'a pas pu être préparé. Réessayez."
                : String(erreur)}
        </SpaceFlash>
      )}
      {isDemoPayment && <SpaceFlash tone="error">Mode démonstration : aucun paiement réel n&apos;est effectué.</SpaceFlash>}

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-7">
          <p className="label">{overview.fee?.label ?? "Cotisation annuelle"}</p>
          {!overview.available ? (
            <p className="mt-4 text-muted">Le paiement en ligne sera disponible prochainement.</p>
          ) : amount == null ? (
            <p className="mt-4 text-muted">Le montant de la cotisation n&apos;est pas encore fixé. Le secrétariat vous informera dès l&apos;ouverture des paiements.</p>
          ) : (
            <>
              <p className="mt-3 font-display text-[2.6rem] leading-none font-extrabold tracking-[-0.02em] text-navy">{formatAmount(amount, overview.fee?.currency)}</p>
              <p className="mt-2 text-[0.92rem] text-muted">par année civile</p>
              <div className="mt-8 space-y-4">
                {years.map((y) =>
                  overview.paidYears.has(y) ? (
                    <div key={y} className="flex items-center justify-between border-t border-line pt-4">
                      <span className="font-semibold text-navy">Cotisation {y}</span>
                      <StatusTag tone="success">Réglée</StatusTag>
                    </div>
                  ) : (
                    <form key={y} action={startFeePayment} className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <input type="hidden" name="year" value={y} />
                      <span className="font-semibold text-navy">Cotisation {y}</span>
                      {isPaymentEnabled ? (
                        <SubmitButton pendingLabel="Redirection vers le paiement…">Payer {formatAmount(amount, overview.fee?.currency)}</SubmitButton>
                      ) : (
                        <span className="font-mono text-[0.75rem] text-muted">Paiement en ligne bientôt disponible</span>
                      )}
                    </form>
                  ),
                )}
              </div>
              {!due.length && <p className="mt-6 text-[0.92rem] text-muted">Vous êtes à jour de vos cotisations. Merci.</p>}
            </>
          )}
        </Panel>

        <Panel className="xl:col-span-5">
          <p className="label">Moyens de paiement</p>
          <ul className="mt-4 space-y-3 text-[0.95rem]">
            <li className="flex gap-3">
              <Smartphone aria-hidden className="mt-0.5 size-5 shrink-0 text-cyan-dark" />
              <span>
                <span className="font-semibold text-navy">Mobile Money</span>
                <span className="block text-muted">Orange Money, MTN Mobile Money</span>
              </span>
            </li>
            <li className="flex gap-3">
              <CreditCard aria-hidden className="mt-0.5 size-5 shrink-0 text-cyan-dark" />
              <span>
                <span className="font-semibold text-navy">Carte bancaire</span>
                <span className="block text-muted">Visa, Mastercard</span>
              </span>
            </li>
          </ul>
          <p className="mt-6 border-t border-line pt-4 text-[0.85rem] text-muted">
            Le paiement s&apos;effectue sur la page sécurisée de notre prestataire CinetPay. REPTIC.CM n&apos;a jamais accès à vos coordonnées bancaires ni à votre code Mobile Money.
          </p>
        </Panel>
      </div>

      <Panel className="mt-6">
        <p className="label">Historique</p>
        {overview.payments.length ? (
          <ul className="mt-4 border-t-2 border-navy">
            {overview.payments.map((p) => {
              const [label, tone] = statusTag[p.status];
              return (
                <li key={p.reference} className="grid gap-2 border-b border-line py-3.5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
                  <span>
                    <span className="block font-semibold text-navy">
                      Cotisation {p.year} · {formatAmount(p.amount, p.currency)}
                    </span>
                    <span className="font-mono text-[0.72rem] text-muted">
                      {p.reference} · {formatDate(p.paidAt ?? p.createdAt, { day: "2-digit", month: "2-digit", year: "numeric" })}
                      {p.method ? ` · ${p.method}` : ""}
                    </span>
                  </span>
                  <StatusTag tone={tone}>{label}</StatusTag>
                  {p.status === "paid" ? (
                    <Link href={`/espace/cotisation/recu/${p.reference}`} className="text-sm font-semibold text-navy underline underline-offset-4 hover:text-cyan-dark">
                      Reçu
                    </Link>
                  ) : (
                    <span />
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-[0.92rem] text-muted">Aucun paiement en ligne pour le moment.</p>
        )}
      </Panel>
    </>
  );
}
