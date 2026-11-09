"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary px-4 py-2 text-[0.85rem]">
      <Printer aria-hidden className="size-4" /> Imprimer ou enregistrer en PDF
    </button>
  );
}
