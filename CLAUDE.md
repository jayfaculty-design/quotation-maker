# CLAUDE.md

Project context and conventions for the **Proforma, Quotation & Tender Preparation System**.

## What this is

A multi-subsidiary Next.js web app for preparing and generating tender, quotation,
and proforma-invoice documents as downloadable Word/zip packages. It serves five
Ghanaian healthcare companies under common ownership:

- Beautiful Creations Ltd (parent)
- BC Medicals Ltd
- BC Pharmaceuticals Ltd
- Loverealm Ltd
- Drug Loft Pharmacy Ltd

These companies bid on healthcare procurement tenders (Ghana Health Service,
Jubilee House, Komfo Anokye Teaching Hospital, etc.) and international bodies
(World Bank, UN, WHO, ECOWAS, AfDB).

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS v4 (Geist Sans / Geist Mono)
- Document generation: `docxtemplater` + `pizzip` + `jszip`
- State persistence: `localStorage` via custom hooks
- Path alias `@/` → `src/`

## Architecture / routing

```
src/app/
  page.tsx                      Homepage — pick a company (entity)
  [entity]/page.tsx             Pick a document type (proforma | quotation | tender)
  [entity]/[docType]/page.tsx   Router — renders the right prep workspace
  api/generate/route.ts         Reads branded templates, renders, returns a .zip
src/data/
  entities.ts                   The 5 companies (slug, name, accent, etc.)
  documentTypes.ts              The 3 document types + availability status
  hospitals.ts                  Seed hospital list (name + address)
src/lib/
  useHospitals.ts               Seed hospitals merged with localStorage additions
  usePersistentState.ts         useState that persists to localStorage (hydration-safe)
  numberToWords.ts              Amount-in-words for grand total
src/components/
  BidWorkspace.tsx              The quotation workspace (the live one)
public/templates/
  <entity>/<docType>/*.docx     Per-company, per-doctype branded templates
```

Dynamic segments `[entity]/[docType]` mean all 5 companies × 3 document types are
served by one set of files driven by data — not hand-built folders.

## Current status

- **Live:** Beautiful Creations → quotation (`BidWorkspace`).
- **Pending:** proforma + tender workspaces; the other four entities; a six-year
  document archive (search/retrieval — not built yet).

## docxtemplater conventions (important)

- Delimiters are **`{{ }}`** (double braces), set explicitly in the Docxtemplater
  config: `delimiters: { start: "{{", end: "}}" }`. Single-brace defaults will throw
  "Duplicate open/close tag".
- **Single-run rule:** every placeholder must live in ONE Word run. Word fragments
  tags across runs when you format part of a tag, which causes duplicate-tag parse
  errors. Type tags in one clean pass; superscript/format the WHOLE tag, never part.
- **Do formatting in JS, not the template.** Compute cased variants
  (`itemNameUpper` / `itemNameTitle`), quantity summaries (`"Various"` when >1 item),
  and the split date fields server-side; expose each as its own placeholder.
- **Superscript date suffix:** the date is split into `{{dateDay}}{{daySuffix}}
  {{dateMonth}}, {{dateYear}}`; `{{daySuffix}}` is pre-formatted as superscript in
  the template so the injected "th"/"st"/"nd"/"rd" renders raised.
- The generate route reads ALL `.docx` files in the entity/docType folder (globs +
  sorts, skips `~$` lock files). Adding a template is a file operation, no code change.
- **Security:** `entity`/`docType` come from the client — always validate against
  the known slugs in `entities.ts`/`documentTypes.ts` before building a filesystem
  path. Never interpolate raw client input into a path (traversal risk).

## Other gotchas

- **Dates:** `<input type="date">` emits `YYYY-MM-DD`, which `new Date(...)` parses as
  UTC midnight. Read it back with `getUTCDate()` / `getUTCFullYear()` and
  `toLocaleDateString(..., { timeZone: "UTC" })`, or the day shifts on non-UTC
  (e.g. US-region) servers.
- **Persistence:** `usePersistentState` gates localStorage writes behind a `loaded`
  flag so the initial default never overwrites saved data on load.
- **Deployment:** filesystem template reads work in dev and on persistent-disk
  servers. Vercel serverless can READ bundled `public/` files but cannot WRITE — any
  future "upload a template" feature needs object storage (S3/R2), not local FS.

## Design language

Neutral canvas (`#f6f7f9`), white cards, slate ink, single teal accent (`teal-600/700`)
for interface actions; brand red `#F42635` reserved for BC Medicals identity only.
Monospace (Geist Mono) for reference numbers and currency figures.

## Conventions

- Be honest about limitations; prefer accurate over optimistic.
- Deliverables are consultant-grade (suitable for Ministry/board/donor submission).
