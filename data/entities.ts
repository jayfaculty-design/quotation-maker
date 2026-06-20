// src/data/entities.ts
// The five companies under common ownership. Slug drives the URL (/[entity]).
// accent + initials + tagline are presentational — edit to match real branding.

export interface Entity {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  accent: string; // brand colour (hex)
  initials: string;
  logo?: string; // path under /public; falls back to the initials badge if unset
}

export const ENTITIES: Entity[] = [
  {
    slug: "beautiful-creations",
    name: "Beautiful Creations Ltd",
    short: "Beautiful Creations",
    tagline: "Parent group — total healthcare solutions",
    accent: "#0F766E",
    initials: "BC",
    logo: "/logos/beautiful-creations.png",
  },
  {
    slug: "bc-medicals",
    name: "BC Medicals Ltd",
    short: "BC Medicals",
    tagline: "Total Healthcare Solutions Provider",
    accent: "#F42635",
    initials: "BM",
    logo: "/logos/bc-medicals.png",
  },
  {
    slug: "bc-pharmaceuticals",
    name: "BC Pharmaceuticals Ltd",
    short: "BC Pharmaceuticals",
    tagline: "Pharmaceutical supply & distribution",
    accent: "#1D4ED8",
    initials: "BP",
    logo: "/logos/bc-pharmaceuticals.png",
  },
  {
    slug: "loverealm",
    name: "Loverealm Ltd",
    short: "Loverealm",
    tagline: "Medical & healthcare provisioning",
    accent: "#7C3AED",
    initials: "LR",
    logo: "/logos/loverealm.png",
  },
  {
    slug: "drug-loft",
    name: "Drug Loft Pharmacy Ltd",
    short: "Drug Loft Pharmacy",
    tagline: "Retail & institutional pharmacy",
    accent: "#B45309",
    initials: "DL",
    logo: "/logos/drug-loft.png",
  },
];

export const getEntity = (slug: string): Entity | undefined =>
  ENTITIES.find((e) => e.slug === slug);
