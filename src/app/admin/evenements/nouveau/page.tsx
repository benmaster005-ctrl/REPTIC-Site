import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/admin";
import { getCategoriesOf } from "@/lib/data/admin";
import { AdminHeader } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/ContentForms";

export const metadata: Metadata = { title: "Nouvel événement" };

export default function NewEventPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <NewEvent />
    </Suspense>
  );
}

async function NewEvent() {
  await requirePermission("events.manage");
  const categories = await getCategoriesOf("event");
  return (
    <>
      <Link href="/admin/evenements" className="link-arrow mb-6">
        <ArrowLeft aria-hidden className="size-4" /> Événements
      </Link>
      <AdminHeader label="Contenus" title="Nouvel événement" />
      <div className="mt-8">
        <EventForm initial={{ status: "draft", visibility: "public", city: "Yaoundé" }} categories={categories} />
      </div>
    </>
  );
}
