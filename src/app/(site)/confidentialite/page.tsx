import { EditorialPage, editorialMetadata } from "@/components/ui/editorial";

export const generateMetadata = () => editorialMetadata("confidentialite", "/confidentialite");

export default function Page() {
  return <EditorialPage slug="confidentialite" />;
}
