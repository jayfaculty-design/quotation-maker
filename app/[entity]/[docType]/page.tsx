// src/app/[entity]/[docType]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getEntity } from "@/data/entities";
import { getDocType, isDocTypeAvailable } from "@/data/documentTypes";
import BidWorkspace from "@/components/BidWorkspace";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ entity: string; docType: string }>;
}) {
  const { entity: eSlug, docType: dSlug } = await params;
  const entity = getEntity(eSlug);
  const docType = getDocType(dSlug);
  if (!entity || !docType) notFound();

  // Gate anything not live for this specific entity.
  if (!isDocTypeAvailable(entity.slug, docType.slug)) {
    return (
      <ComingSoon
        entityName={entity.name}
        docName={docType.name}
        backHref={`/${entity.slug}`}
      />
    );
  }

  // Route to the correct preparation system. Quotation and proforma share the
  // entity-aware BidWorkspace (it adapts its labels/fields to the doc type).
  switch (docType.slug) {
    case "quotation":
    case "proforma":
      return (
        <BidWorkspace entitySlug={entity.slug} docTypeSlug={docType.slug} />
      );
    // case "tender":   return <TenderWorkspace entity={entity} />;
    default:
      return (
        <ComingSoon
          entityName={entity.name}
          docName={docType.name}
          backHref={`/${entity.slug}`}
        />
      );
  }
}

function ComingSoon({
  entityName,
  docName,
  backHref,
}: {
  entityName: string;
  docName: string;
  backHref: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f9] px-5 font-sans text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {entityName}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        {docName} preparation
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        This system isn&apos;t live yet. It&apos;s next on the build list.
      </p>
      <Link
        href={backHref}
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
    </div>
  );
}
