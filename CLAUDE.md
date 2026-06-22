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
- Path alias `@/` → **repo root** (`./`). Source lives at the root, NOT under
  `src/` — ignore the legacy `// src/...` comments in some file headers.

## Architecture / routing

```
app/
  page.tsx                      Homepage — pick a company (entity)
  [entity]/page.tsx             Pick a document type (proforma | quotation | tender)
  [entity]/[docType]/page.tsx   Router — renders the right prep workspace
  api/generate/route.ts         Reads branded templates, renders, returns a .zip
data/
  entities.ts                   The 5 companies (slug, name, accent, logo, initials)
  documentTypes.ts              The 3 document types + availability status
  hospitals.ts                  Seed hospital list (name + address)
lib/
  useHospitals.ts               Seed hospitals merged with localStorage additions
  usePersistentState.ts         useState that persists to localStorage (hydration-safe)
  useAssemblies.ts              Saved assemblies per entity+docType (recent list, reopen/edit)
  numberToWords.ts              Amount-in-words for grand total
components/
  BidWorkspace.tsx              The quotation workspace — entity-aware (serves all 5)
public/
  logos/<entity>.png            Per-entity logo shown in the workspace header
  templates/<entity>/<docType>/*.docx   Per-company, per-doctype branded templates
```

Dynamic segments `[entity]/[docType]` mean all 5 companies × 3 document types are
served by one set of files driven by data — not hand-built folders.

`BidWorkspace` is entity-aware: it resolves the entity from the slug for branding
(logo, accent) and namespaces every `localStorage` key as
`${entitySlug}-${docTypeSlug}-${key}`, so each company keeps an independent draft.

## Current status

- **Live:** quotation (`BidWorkspace`) for **all 5 entities** — each has a fully
  placeholdered `.docx` set under `public/templates/<entity>/quotation/`.
- **Pending:** proforma + tender workspaces; a six-year document archive
  (search/retrieval — not built yet).

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
- **Headers/footers count too.** docxtemplater renders `word/header*.xml` /
  `footer*.xml`, not just `document.xml`. The PRICE SCHEDULE repeats the SQ number
  and title in its page header (`header2.xml`) — placeholders must go there as well.
  When templatizing a doc, check every `word/*.xml` part, not only the body.
- **Conditional / repeating table rows.** For a row that should repeat per item
  or vanish when empty (e.g. the price-schedule line-item loop, or a tax row that
  only appears when a tax is ticked), wrap it with `{{#section}}…{{/section}}`.
  docxtemplater expands a loop tag to its whole `<w:tr>` only when the open and
  close tags sit in **different cells of the same row**. The totals rows are a
  single merged (gridSpan) cell, so the tax row is split into a wide cell + a thin
  borderless cell to host the two tags — that is what lets the row drop entirely
  for VAT-exempt quotes. Tags in one cell loop the *paragraph*, leaving an empty row.

### Placeholders the route exposes (see `api/generate/route.ts`)

`hospitalName`, `hospitalAddress`, `sqNumber`, `tenderTitle`, `titleUpper`,
`titleTitle`, `itemNameUpper`, `itemNameTitle`, `quantitySummary` ("VARIOUS" when
>1 line item, else the single qty), `dateDay`, `daySuffix`, `dateMonth`,
`dateMonthUpper`, `dateYear`, `deliveryTerms`, `validityTerms`, `paymentTerms`,
`warranty`, `subTotal`, `taxAmount`, `grandTotal`, `grandTotalWords`,
`taxLines[]` ({label, amount} per enabled non-zero tax — empty ⇒ no tax row),
and `lineItems[]` ({nums, description, uom, qty, unitPrice, totalPrice}).

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
- **Verifying a template** by rendering it and checking for leftover `{{`/`}}`
  catches *unrendered tags* but NOT hardcoded sample values left behind (they have
  no braces). After editing a template, also audit every `word/*.xml` part for
  stale sample data (hospital names, SQ fragments, sample figures).
- **Per-entity templates are not uniform.** Each entity's `.docx` set has its own
  letterhead, run layout, and sometimes its own sample data and columns (e.g.
  drug-loft has no UOM column, uses 4% VAT, and duplicates content via Word
  `mc:AlternateContent` so values must be replaced in every copy). Re-inspect run
  structure per document rather than reusing another entity's run indices.
- **Deployment:** filesystem template reads work in dev and on persistent-disk
  servers. Vercel serverless can READ bundled `public/` files but cannot WRITE — any
  future "upload a template" feature needs object storage (S3/R2), not local FS.

## Design language

Neutral canvas (`#f6f7f9`), white cards, slate ink, single teal accent (`teal-600/700`)
for interface actions; brand red `#F42635` reserved for BC Medicals identity only.
Monospace (Geist Mono) for reference numbers and currency figures.

The workspace header shows the selected entity's logo from `public/logos/<slug>.png`
(set via `entity.logo` in `entities.ts`), falling back to a colored initials badge
if the logo is unset or fails to load.

## Conventions

- Be honest about limitations; prefer accurate over optimistic.
- Deliverables are consultant-grade (suitable for Ministry/board/donor submission).
