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

// Per-entity availability later, e.g.:
//   export const AVAILABILITY: Record<string, string[]> = {
//     "beautiful-creations": ["quotation"],
//     "bc-medicals": [],
//   };
// then check AVAILABILITY[entitySlug]?.includes(docTypeSlug) instead of status.
