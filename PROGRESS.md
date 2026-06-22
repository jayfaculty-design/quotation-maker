# PROGRESS

Project snapshot for the **Proforma, Quotation & Tender Preparation System** — a
multi-subsidiary Next.js app that generates branded Word/zip document packages for
five Ghanaian healthcare companies under the Beautiful Creations group.

> Companion docs: `CLAUDE.md` (conventions, docxtemplater rules, gotchas) is the
> authoritative reference. This file tracks **what's built and what's left**.

_Last updated: 2026-06-22 · branch `main`._

---

## Stack

- **Next.js 16.2.9** (App Router, TypeScript) + **Tailwind CSS v4** (Geist Sans / Geist Mono)
- Document generation: `docxtemplater` + `pizzip` + `jszip`
- State persistence: `localStorage` via custom hooks
- Path alias `@/` → **repo root** (`./`). Source lives at the root, not under `src/`.

---

## File map

```
app/
  layout.tsx                    Root layout, fonts, metadata (title = "TenderSuite …")
  page.tsx                      Homepage → renders <Landing/>
  globals.css                   Light glass theme, Geist base font, blob/float/reveal/fade-up keyframes
  [entity]/page.tsx             Document-type picker (redesigned, glassmorphism)
  [entity]/[docType]/page.tsx   Router → BidWorkspace for quotation|proforma|tender, else ComingSoon
  api/generate/route.ts         Reads templates, renders, bundles certificates, returns .zip
  api/manifest/route.ts         GET → real per-entity {documents[], certificates[]} counts
components/
  Landing.tsx                   Internal landing page (client; hero, company cards, slim footer)
  BidWorkspace.tsx              The live prep workspace — entity-aware, serves all 3 doc types
data/
  entities.ts                   5 companies (slug, name, short, tagline, accent, initials, logo)
  documentTypes.ts              3 doc types + per-entity AVAILABILITY matrix + isDocTypeAvailable()
  hospitals.ts                  Seed procuring-entity list
lib/
  useHospitals.ts               Seed hospitals merged with localStorage additions
  usePersistentState.ts         Hydration-safe persisted useState (gated by `loaded` flag)
  useAssemblies.ts              Saved assemblies per entity+docType (recent list, reopen/edit)
  numberToWords.ts              Amount-in-words for grand total
public/
  logos/<entity>.png            5 entity logos (all present)
  templates/<entity>/<docType>/*.docx   Branded templates (read by the generate route)
  templates/<entity>/certificates/*.pdf  Company certificates (bundled into non-proforma packages)
```

---

## Current state

### Live & working
- **Landing page** (`components/Landing.tsx`) — glassmorphism redesign: sticky glass nav +
  mobile menu, hero (gradient headline, dual CTAs, glass dashboard + floating cards, animated
  blob backdrop), animated-counter stats strip, company ("tender source") cards with logos +
  live-system badges + hover glow, feature panels, trust section (agency pills, testimonial,
  metrics), final CTA, full footer. Reveal-on-scroll; `prefers-reduced-motion` respected.
- **Document-type picker** (`app/[entity]/page.tsx`) — matching glass redesign: entity-accented
  backdrop, glass back-link + brand bar, logo hero, three doc-type cards with Available /
  Coming-soon states and per-entity accent. Staggered fade-up entrance.
- **BidWorkspace** — entity-aware (resolves logo/accent from slug; namespaces every localStorage
  key as `${entity}-${docType}-${key}`). Serves **quotation, proforma, tender** with doc-type-aware
  labels (Hospital / Consignee / Procuring entity; SQ number / Proforma number / Tender number; etc.).
  Live totals, **conditional VAT** (only renders a tax row when ticked), **discount** (proforma only),
  amount-in-words, certificate bundling.
- **Generate route** — validates entity/docType against known slugs, reads every `.docx` in the
  folder (globs, skips `~$` locks), renders with `{{ }}` delimiters, bundles `certificates/*` for
  non-proforma packages, returns a `.zip` (Buffer→Uint8Array copy for BodyInit).

### Availability matrix (`data/documentTypes.ts`)

| Entity | Quotation | Proforma | Tender |
|---|---|---|---|
| beautiful-creations | ✅ live (7 docx) | ✅ live (1) | ✅ live (10 docx, GH¢) |
| bc-medicals | ✅ live (7) | ✅ live (1) | ❌ no templates |
| bc-pharmaceuticals | ✅ live (7) | ❌ no template | ❌ no templates |
| loverealm | ✅ live (7) | ✅ live (1) | ✅ live (12 docx, GH¢) |
| drug-loft | ✅ live (6) | ✅ live (1) | ✅ live (12 docx, GH¢) |

Certificates: 4–5 PDFs per entity, all present, bundled into quotation/tender packages.

**Recent assemblies** (`lib/useAssemblies.ts`): every workspace snapshots its inputs to
localStorage (per entity+docType) on assemble or "Save draft", so a quotation/proforma/tender
can be reopened and edited later. Browser-local only — not synced across devices/users.

---

## What still needs to be done

1. **Decision: should saved assemblies outlive the browser?** `useAssemblies` is localStorage-only,
   so saved packages don't survive a cache-clear and don't sync across devices/staff. Reliable
   cross-device "save for later" needs a backend (DB + object storage), not just local FS — a real
   feature to scope if wanted.
2. **bc-medicals / bc-pharmaceuticals tender** — no templates provided; stay "Coming soon".
3. **bc-pharmaceuticals proforma** — no template yet (intentionally excluded from availability).
4. **Six-year document archive** (search/retrieval) — not started.
5. **Content / naming** — "TenderSuite" is a placeholder product name (used in nav/footer); rename
   to whatever the group prefers. Landing page was trimmed to internal essentials (fabricated SaaS
   stats / testimonial / "trusted by" pills removed).
6. **Nice-to-have** — a combined "recent assemblies across all companies" view (currently scoped
   per workspace).

### Done since first draft of this file
- Tender brought live for **drug-loft, loverealm, beautiful-creations** (incl. collapsing
  beautiful-creations' multi-LOT price schedule to a single dynamic loop table).
- Landing page redesigned (glassmorphism) then **trimmed to internal essentials**; document-type
  picker and the BidWorkspace given a matching glass polish pass.
- **Recent assemblies** save/reopen/edit feature added to every workspace.

### Deployment note
Filesystem template reads work in dev and on persistent-disk servers. Vercel serverless can
READ bundled `public/` files but cannot WRITE — any future "upload a template" feature needs
object storage (S3/R2), not local FS.
