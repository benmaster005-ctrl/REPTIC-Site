import { EditorialPage, editorialMetadata } from "@/components/ui/editorial";

export const generateMetadata = () => editorialMetadata("mentions-legales", "/mentions-legales");

export default function Page() {
  return <EditorialPage slug="mentions-legales" />;
}
