// src/data/documentTypes.ts
// The three preparation systems. `status` gates which are live.
//
// For now status is global. When (say) quotation is ready for some entities
// but not others, switch to a per-entity matrix — see note at the bottom.

export interface DocType {
  slug: string;
  name: string;
  description: string;
  status: "available" | "coming-soon";
}

export const DOC_TYPES: DocType[] = [
  {
    slug: "proforma",
    name: "Proforma Invoice",
    description:
      "Prepare proforma invoices for advance quotes and pricing confirmation.",
    status: "coming-soon",
  },
  {
    slug: "quotation",
    name: "Quotation",
    description:
      "Build fully formatted quotation and bid packages from branded templates.",
    status: "available",
  },
  {
    slug: "tender",
    name: "Tender",
    description:
      "Assemble complete tender submissions with all required compliance forms.",
    status: "coming-soon",
  },
];

export const getDocType = (slug: string): DocType | undefined =>
  DOC_TYPES.find((d) => d.slug === slug);

// Per-entity availability. `status` above is only a coarse default/label now;
// what's actually live is gated here, because a document type can be ready for
// some entities but not others (e.g. proforma exists for every entity except
// bc-pharmaceuticals, whose template hasn't been added yet).
const AVAILABILITY: Record<string, string[]> = {
  quotation: [
    "beautiful-creations",
    "bc-medicals",
    "bc-pharmaceuticals",
    "loverealm",
    "drug-loft",
  ],
  // bc-pharmaceuticals has no proforma template yet; the other four are live.
  proforma: ["beautiful-creations", "bc-medicals", "loverealm", "drug-loft"],
  // tender: not built for any entity yet
};

export const isDocTypeAvailable = (
  entitySlug: string,
  docTypeSlug: string,
): boolean => (AVAILABILITY[docTypeSlug] ?? []).includes(entitySlug);
