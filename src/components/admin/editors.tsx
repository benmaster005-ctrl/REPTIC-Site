"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MAX_FILE_BYTES, formatBytes, safeFileName } from "@/lib/membership";
import { registerAssociationDocument } from "@/app/actions/admin-content";
import { type FormState } from "@/lib/forms";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const mediaUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${SUPABASE_URL}/storage/v1/object/public/public-media/${path}`);

/** Champ Markdown avec onglet d'aperçu (rendu identique au site public). */
export function MarkdownField({ name, label, state, rows = 14, hint }: { name: string; label: string; state: FormState; rows?: number; hint?: string }) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [value, setValue] = useState(state.values?.[name] ?? "");
  const errors = state.fieldErrors?.[name];
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <label htmlFor={`champ-${name}`} className="field-label mb-0">
          {label}
        </label>
        <div role="tablist" className="flex border border-line text-[0.8rem] font-semibold">
          {(["edit", "preview"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3 py-1.5 ${tab === t ? "bg-navy text-white" : "text-navy hover:bg-paper"}`}>
              {t === "edit" ? "Rédiger" : "Aperçu"}
            </button>
          ))}
        </div>
      </div>
      <textarea
        id={`champ-${name}`}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`field-input font-mono text-[0.88rem] leading-relaxed ${tab === "preview" ? "hidden" : ""}`}
        aria-invalid={errors?.length ? true : undefined}
      />
      {tab === "preview" && (
        <div className="min-h-48 border border-line-strong bg-white px-5 py-4">
          {value.trim() ? (
            <div className="prose-site">
              <Markdown components={{ h1: ({ children }) => <h2>{children}</h2> }}>{value}</Markdown>
            </div>
          ) : (
            <p className="text-muted">Rien à afficher.</p>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-muted">{hint ?? "Mise en forme Markdown : ## Intertitre, **gras**, - liste, [lien](https://…)."}</p>
      {errors?.map((e) => (
        <p key={e} className="field-error">
          {e}
        </p>
      ))}
    </div>
  );
}

/** Image publique (couverture, portrait) envoyée dans « public-media ». */
export function ImageField({ name, label, folder, state }: { name: string; label: string; folder: string; state: FormState }) {
  const [path, setPath] = useState(state.values?.[name] ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Formats acceptés : JPEG, PNG, WebP.");
    if (file.size > 5 * 1024 * 1024) return setError(`Image trop lourde (${formatBytes(file.size)}). Maximum : 5 Mo.`);
    setBusy(true);
    const target = `${folder}/${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`;
    const { error: upErr } = await createClient().storage.from("public-media").upload(target, file, { contentType: file.type, cacheControl: "31536000" });
    setBusy(false);
    if (upErr) return setError("L'envoi a échoué.");
    setPath(target);
  }

  return (
    <div>
      <p className="field-label">{label}</p>
      <input type="hidden" name={name} value={path} />
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />
      {path ? (
        <div className="relative aspect-[16/9] max-w-md overflow-hidden bg-paper">
          <Image src={mediaUrl(path)} alt="" fill sizes="28rem" className="object-cover" unoptimized />
          <div className="absolute top-2 right-2 flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="btn-inverse px-3 py-1.5 text-[0.8rem]">
              Remplacer
            </button>
            <button type="button" onClick={() => setPath("")} className="btn-inverse px-2 py-1.5" aria-label="Retirer l'image">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex aspect-[16/9] w-full max-w-md flex-col items-center justify-center gap-2 border border-dashed border-line-strong bg-paper text-sm font-semibold text-navy hover:border-navy">
          {busy ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <ImagePlus aria-hidden className="size-5" />}
          {busy ? "Envoi…" : "Ajouter une image"}
          <span className="font-mono text-[0.7rem] font-normal text-muted">JPEG, PNG, WebP · 5 Mo max</span>
        </button>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

/** Dépôt d'un document associatif (stockage privé, accès par lien signé). */
export function AssociationDocumentUpload() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"members" | "public">("members");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Choisissez un fichier.");
    if (title.trim().length < 2) return setError("Donnez un titre au document.");
    if (file.size > MAX_FILE_BYTES) return setError("Fichier trop volumineux (10 Mo maximum).");
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Formats acceptés : PDF, JPEG, PNG, WebP.");
    setBusy(true);
    const path = `association/${crypto.randomUUID().slice(0, 8)}-${safeFileName(file.name)}`;
    const { error: upErr } = await createClient().storage.from("private-documents").upload(path, file, { contentType: file.type });
    if (upErr) {
      setBusy(false);
      return setError("L'envoi a échoué.");
    }
    const res = await registerAssociationDocument({ storagePath: path, title: title.trim(), fileName: file.name, visibility });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setTitle("");
    setFile(null);
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_14rem]">
      <label className="block">
        <span className="field-label">Titre</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" placeholder="Ex. Statuts de l'association" />
      </label>
      <label className="block">
        <span className="field-label">Accès</span>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value as "members" | "public")} className="field-input">
          <option value="members">Membres uniquement</option>
          <option value="public">Tous les comptes connectés</option>
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="field-label">Fichier</span>
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="field-input file:mr-4 file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white" />
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />}
          {busy ? "Envoi…" : "Publier le document"}
        </button>
        {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      </div>
    </form>
  );
}
