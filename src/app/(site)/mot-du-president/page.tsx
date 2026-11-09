import { EditorialPage, editorialMetadata } from "@/components/ui/editorial";

export const generateMetadata = () => editorialMetadata("mot-du-president", "/mot-du-president");

export default function Page() {
  return <EditorialPage slug="mot-du-president" crumbs={[{ label: "Le REPTIC" }]} eyebrow="Le REPTIC" />;
}
