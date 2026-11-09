import { EditorialPage, editorialMetadata } from "@/components/ui/editorial";

export const generateMetadata = () => editorialMetadata("presentation", "/presentation");

export default function Page() {
  return <EditorialPage slug="presentation" crumbs={[{ label: "Le REPTIC" }]} eyebrow="Le REPTIC" />;
}
