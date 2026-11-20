import { memberBenefits, missions } from "@/content/site";
import { EditorialPage, editorialMetadata } from "@/components/ui/editorial";
import { JoinBand, RuledList, SectionHeader } from "@/components/ui/content";

export const generateMetadata = () => editorialMetadata("objectifs-missions", "/objectifs-missions");

export default function Page() {
  return (
    <EditorialPage slug="objectifs-missions" crumbs={[{ label: "Le REPTIC" }]} eyebrow="Le REPTIC">
      <section className="panel panel-pad bg-surface">
        <SectionHeader label="Axes stratégiques" title="Nos domaines d'intervention" />
        <div className="mt-12 lg:ml-[calc(25%+0.375rem)]">
          <RuledList items={missions} />
        </div>
      </section>
      <section className="panel panel-pad bg-ice">
        <div>
          <SectionHeader label="Résultats attendus" title="Ce que le réseau apporte à ses membres" />
          <div className="mt-12 lg:ml-[calc(25%+0.375rem)]">
            <RuledList items={memberBenefits} columns={2} />
          </div>
        </div>
      </section>
      <JoinBand />
    </EditorialPage>
  );
}
