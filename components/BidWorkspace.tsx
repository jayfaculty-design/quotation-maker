"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  FileDown,
  Loader2,
  FileText,
  ChevronDown,
  Save,
  History,
  Pencil,
} from "lucide-react";
import { useHospitals } from "@/lib/useHospitals";
import { usePersistentState } from "@/lib/usePersistentState";
import { useAssemblies, type SavedAssembly } from "@/lib/useAssemblies";
import { getEntity } from "@/data/entities";
import { getDocType } from "@/data/documentTypes";

interface LineItem {
  id: string;
  description: string;
  uom: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

interface TaxRate {
  id: string;
  name: string;
  percentage: number;
  enabled: boolean;
}

/* ---------- shared styling tokens ---------- */
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15";
const labelClass =
  "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500";
const glassPanel =
  "rounded-3xl border border-white/60 bg-white/70 shadow-[0_10px_40px_-16px_rgba(2,6,23,0.18)] backdrop-blur-xl";

const PACKAGE_DOCS = [
  "Cover Page",
  "Bid Form 1",
  "Bid Form 2",
  "Price Schedule",
  "Bid Form 5",
  "Table of Contents",
  "Sub Tittles",
];

const ADD_NEW = "__add__";

/* ---------- workspace defaults (also used to start a fresh assembly) ---------- */
const DEFAULT_METADATA = {
  hospitalName: "UNIVERSITY OF GHANA MEDICAL CENTRE LTD",
  hospitalAddress: "P. O. BOX LG 25, LEGON- ACCRA, GHANA",
  sqNumber: "RFQ/UGMC/PU/PQ/GDS/SCRB/58/2026",
  date: "2026-05-08",
  title: "SUPPLY OF SCRUBS",
  itemName: "SCRUBS",
  deliveryTerms: "IMMEDIATELY AFTER ORDER CONFIRMATION",
  validityTerms: "90 DAYS",
  paymentTerms: "WITHIN 30 DAYS",
  warranty: "24 MONTHS",
};
const DEFAULT_ITEMS: LineItem[] = [
  {
    id: "1",
    description: "SCRUBS (MEDIUM) - COLOUR: ROYAL BLUE",
    uom: "PCS",
    qty: 30,
    unitPrice: 250,
    totalPrice: 7500,
  },
  {
    id: "2",
    description: "SCRUBS (LARGE) - COLOUR: ROYAL BLUE",
    uom: "PCS",
    qty: 60,
    unitPrice: 250,
    totalPrice: 15000,
  },
];
const DEFAULT_TAXES: TaxRate[] = [
  { id: "vat", name: "VAT", percentage: 20, enabled: true },
];
const DEFAULT_DISCOUNT = { percentage: 0, enabled: false };

/* A saved assembly captures the whole workspace input. */
type DraftSnapshot = {
  metadata: typeof DEFAULT_METADATA;
  items: LineItem[];
  taxes: TaxRate[];
  discount: typeof DEFAULT_DISCOUNT;
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

/* ---------- small presentational helpers ---------- */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="h-3.5 w-0.5 rounded-full bg-teal-600" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {children}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
export default function BidWorkspace({
  entitySlug,
  docTypeSlug,
}: {
  entitySlug: string;
  docTypeSlug: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [manifest, setManifest] = useState<{
    documents: string[];
    certificates: string[];
  } | null>(null);

  // Resolve presentational identity from the slugs (validated upstream by the
  // router page). Branding + storage keys are scoped per entity/docType so each
  // company keeps its own independent draft.
  const entity = getEntity(entitySlug);
  const docType = getDocType(docTypeSlug);
  const ns = (key: string) => `${entitySlug}-${docTypeSlug}-${key}`;

  // A proforma invoice is a single document with no tax line and no
  // delivery/validity/payment/warranty terms — the workspace adapts its labels
  // and hides the irrelevant sections for it.
  const isProforma = docTypeSlug === "proforma";
  const isTender = docTypeSlug === "tender";
  // The buying party: a hospital for a quotation, the consignee on a proforma
  // invoice, the procuring entity on a tender.
  const partyLabel = isProforma
    ? "Consignee"
    : isTender
      ? "Procuring entity"
      : "Hospital";

  // Hospital list (seed + saved) and add helper
  const { hospitals, addHospital } = useHospitals();
  const [selectedHospitalId, setSelectedHospitalId] = usePersistentState(
    ns("hospital"),
    "ugmc",
  );
  const [isAddingHospital, setIsAddingHospital] = useState(false);

  // 1. Template Variables Form Setup
  const [metadata, setMetadata] = usePersistentState(
    ns("metadata"),
    DEFAULT_METADATA,
  );

  // 2. Excel Row Management matching your input arrays
  const [items, setItems] = usePersistentState<LineItem[]>(
    ns("items"),
    DEFAULT_ITEMS,
  );

  // 3. Ghanaian Tax Profile Options
  const [taxes, setTaxes] = usePersistentState(ns("taxes"), DEFAULT_TAXES);

  // Optional percentage discount applied to the subtotal (a deduction, unlike a
  // tax which adds). Off by default.
  const [discount, setDiscount] = usePersistentState(
    ns("discount"),
    DEFAULT_DISCOUNT,
  );

  // Saved assemblies for this entity + document type, plus which one (if any)
  // is currently being edited so re-assembling updates it instead of forking.
  const { assemblies, saveAssembly, removeAssembly } =
    useAssemblies<DraftSnapshot>(entitySlug, docTypeSlug);
  const [currentAssemblyId, setCurrentAssemblyId] = usePersistentState<
    string | null
  >(ns("current-assembly"), null);
  const currentAssembly = assemblies.find((a) => a.id === currentAssemblyId);

  const [totals, setTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    grandTotal: 0,
  });

  // Compute live calculations automatically whenever fields change
  useEffect(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0,
    );
    const activeTaxRate = taxes
      .filter((t) => t.enabled)
      .reduce((sum, t) => sum + t.percentage, 0);
    const taxAmount = subtotal * (activeTaxRate / 100);
    // Discount is a proforma-only deduction.
    const discountAmount =
      isProforma && discount.enabled
        ? subtotal * (discount.percentage / 100)
        : 0;

    setTotals({
      subtotal,
      taxAmount,
      discountAmount,
      grandTotal: subtotal + taxAmount - discountAmount,
    });
  }, [items, taxes, discount, isProforma]);

  // One-time cleanup: drop the legacy COVID-19 Levy from any draft saved before
  // it was replaced by the discount control.
  useEffect(() => {
    if (taxes.some((t) => t.id === "covid")) {
      setTaxes(taxes.filter((t) => t.id !== "covid"));
    }
  }, [taxes, setTaxes]);

  // What the assembled package will actually contain (rendered forms + the
  // company's certificates), read from disk server-side so the count is accurate
  // per entity rather than a hardcoded list.
  useEffect(() => {
    let active = true;
    fetch(`/api/manifest?entity=${entitySlug}&docType=${docTypeSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (active && m)
          setManifest({
            documents: m.documents ?? [],
            certificates: m.certificates ?? [],
          });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [entitySlug, docTypeSlug]);

  /* ---------- hospital selection ---------- */
  const handleHospitalSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;

    if (id === ADD_NEW) {
      setSelectedHospitalId(ADD_NEW);
      setIsAddingHospital(true);
      setMetadata((m) => ({ ...m, hospitalName: "", hospitalAddress: "" }));
      return;
    }

    setIsAddingHospital(false);
    setSelectedHospitalId(id);
    const h = hospitals.find((x) => x.id === id);
    if (h) {
      setMetadata((m) => ({
        ...m,
        hospitalName: h.name,
        hospitalAddress: h.address,
      }));
    }
  };

  const handleSaveHospital = () => {
    if (!metadata.hospitalName.trim()) {
      alert("Enter a hospital name before saving.");
      return;
    }
    const entry = addHospital(metadata.hospitalName, metadata.hospitalAddress);
    setSelectedHospitalId(entry.id);
    setIsAddingHospital(false);
  };

  const updateItem = (id: string, key: keyof LineItem, val: any) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [key]: val };
        if (key === "qty" || key === "unitPrice") {
          updated.totalPrice = updated.qty * updated.unitPrice;
        }
        return updated;
      }),
    );
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        uom: "PCS",
        qty: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length > 1) setItems(items.filter((item) => item.id !== id));
  };

  const money = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Package summary counts — use the real on-disk manifest once loaded, falling
  // back to the static doc list for the first paint.
  const prettyDoc = (f: string) =>
    f
      .replace(/\.docx$/i, "")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const docNames = manifest ? manifest.documents.map(prettyDoc) : PACKAGE_DOCS;
  const docCount = docNames.length;
  const certCount = manifest?.certificates.length ?? 0;

  /* ---------- recent assemblies ---------- */
  const snapshot = (): DraftSnapshot => ({ metadata, items, taxes, discount });

  // Manual save (without generating) — checkpoint the current inputs.
  const saveDraft = () => {
    const id = saveAssembly(snapshot(), currentAssemblyId);
    setCurrentAssemblyId(id);
  };

  // Reopen a saved assembly into the form for editing.
  const loadAssembly = (a: SavedAssembly<DraftSnapshot>) => {
    setMetadata(a.data.metadata);
    setItems(a.data.items);
    setTaxes(a.data.taxes);
    setDiscount(a.data.discount ?? DEFAULT_DISCOUNT);
    setCurrentAssemblyId(a.id);
    setIsAddingHospital(false);
    const h = hospitals.find((x) => x.name === a.data.metadata.hospitalName);
    if (h) setSelectedHospitalId(h.id);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Start a fresh assembly from the defaults.
  const startNewAssembly = () => {
    setMetadata(DEFAULT_METADATA);
    setItems(DEFAULT_ITEMS);
    setTaxes(DEFAULT_TAXES);
    setDiscount(DEFAULT_DISCOUNT);
    setCurrentAssemblyId(null);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteAssembly = (id: string) => {
    removeAssembly(id);
    if (id === currentAssemblyId) setCurrentAssemblyId(null);
  };

  // 4. Send compilation bundle to Next.js API endpoint for processing
  const handleCompilePackage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata,
          items,
          financials: totals,
          taxes,
          discount,
          entity: entitySlug,
          docType: docTypeSlug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server returned status code ${response.status}`,
        );
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const linkAnchor = document.createElement("a");
      linkAnchor.href = downloadUrl;
      linkAnchor.download = `${isProforma ? "PROFORMA" : "BID_PACKAGE"}_${metadata.sqNumber.replace(/\//g, "_")}.zip`;
      document.body.appendChild(linkAnchor);
      linkAnchor.click();
      linkAnchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Save (or update) this assembly so it can be reopened and edited later.
      const savedId = saveAssembly(snapshot(), currentAssemblyId);
      setCurrentAssemblyId(savedId);
    } catch (error: any) {
      console.error("❌ Document assembly fault:", error.message);
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-slate-900">
      {/* ---------- ambient glass backdrop (entity-accented, subtle) ---------- */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eef3fb] via-[#eef2f9] to-[#e9eef7]" />
        <div
          className="animate-blob absolute -left-32 top-[-8rem] h-[24rem] w-[24rem] rounded-full blur-3xl"
          style={{ backgroundColor: `${entity?.accent ?? "#14b8a6"}1f` }}
        />
        <div
          className="animate-blob absolute right-[-10rem] top-40 h-[22rem] w-[22rem] rounded-full bg-sky-300/20 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      {/* ---------- App header ---------- */}
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            {entity?.logo && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entity.logo}
                alt={`${entity.name} logo`}
                onError={() => setLogoError(true)}
                className="h-11 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[13px] font-bold tracking-tight text-white"
                style={{ backgroundColor: entity?.accent ?? "#0f172a" }}
              >
                {entity?.initials ?? "BC"}
              </div>
            )}
            <div className="leading-tight">
              <h1 className="text-sm font-semibold text-slate-900">
                {isProforma ? "Proforma Studio" : "Bid Package Studio"}
              </h1>
              <p className="text-[11px] text-slate-500">
                {entity?.short ?? "BC Medicals"} ·{" "}
                {docType?.name ?? "Quotation"} assembly
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-[11px] font-medium text-slate-500 backdrop-blur-md sm:flex">
            <FileText className="h-3.5 w-3.5 text-teal-600" />
            {docCount} doc{docCount === 1 ? "" : "s"}
            {certCount > 0 && ` · ${certCount} cert${certCount === 1 ? "" : "s"}`}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 pb-32 pt-7">
        {/* ---------- Recent assemblies ---------- */}
        <section className={`${glassPanel} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-teal-600" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Recent assemblies
              </span>
              {assemblies.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {assemblies.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                <Save className="h-3.5 w-3.5" /> Save draft
              </button>
              {currentAssemblyId && (
                <button
                  onClick={startNewAssembly}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700"
                >
                  <Plus className="h-3.5 w-3.5" /> New
                </button>
              )}
            </div>
          </div>

          {currentAssembly && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-xs text-teal-800">
              <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Editing{" "}
                <span className="font-mono font-semibold">
                  {currentAssembly.data.metadata.sqNumber || "Untitled"}
                </span>{" "}
                — re-assembling (or Save draft) updates it. Use{" "}
                <span className="font-semibold">New</span> to start a fresh one.
              </span>
            </div>
          )}

          {assemblies.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">
              Assemble a package — or Save draft — and it&apos;ll appear here so
              you can reopen and edit it later.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {assemblies.map((a) => {
                const active = a.id === currentAssemblyId;
                const m = a.data.metadata;
                const subtitle = m.title || m.itemName;
                return (
                  <li
                    key={a.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition ${
                      active
                        ? "border-teal-300 bg-teal-50/50"
                        : "border-slate-200 bg-white/70 hover:border-slate-300"
                    }`}
                  >
                    <button
                      onClick={() => loadAssembly(a)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate font-mono text-sm font-semibold text-slate-900">
                        {m.sqNumber || "Untitled assembly"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {subtitle ? `${subtitle} · ` : ""}
                        {m.hospitalName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {a.data.items.length} item
                        {a.data.items.length === 1 ? "" : "s"} · saved{" "}
                        {timeAgo(a.savedAt)}
                        {active ? " · editing" : ""}
                      </p>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => loadAssembly(a)}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => deleteAssembly(a.id)}
                        aria-label="Delete assembly"
                        className="rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------- Tender / Invoice details ---------- */}
        <section className={`${glassPanel} p-6`}>
          <SectionLabel>
            {isProforma ? "Invoice details" : "Tender details"}
          </SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={partyLabel}>
              <div className="relative">
                <select
                  value={selectedHospitalId}
                  onChange={handleHospitalSelect}
                  className={`${inputClass} cursor-pointer appearance-none pr-9`}
                >
                  <option value="" disabled>
                    Select a hospital…
                  </option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                  <option value={ADD_NEW}>+ Add new hospital…</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </Field>
            <Field
              label={
                isProforma
                  ? "Proforma number"
                  : isTender
                    ? "Tender number"
                    : "SQ number reference"
              }
            >
              <input
                type="text"
                className={`${inputClass} font-mono tracking-tight`}
                value={metadata.sqNumber}
                onChange={(e) =>
                  setMetadata({ ...metadata, sqNumber: e.target.value })
                }
              />
            </Field>
            <Field label={`${partyLabel} name`}>
              <input
                type="text"
                className={inputClass}
                value={metadata.hospitalName}
                onChange={(e) =>
                  setMetadata({ ...metadata, hospitalName: e.target.value })
                }
                placeholder={
                  isAddingHospital ? "Type the new name…" : undefined
                }
              />
            </Field>
            {!isProforma && (
              <Field label="Procurement title">
                <input
                  type="text"
                  className={inputClass}
                  value={metadata.title}
                  onChange={(e) =>
                    setMetadata({ ...metadata, title: e.target.value })
                  }
                />
              </Field>
            )}
            <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={`${partyLabel} address`}>
                <input
                  type="text"
                  className={inputClass}
                  value={metadata.hospitalAddress}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      hospitalAddress: e.target.value,
                    })
                  }
                  placeholder={
                    isAddingHospital
                      ? "Type the new address…"
                      : undefined
                  }
                />
              </Field>
              {!isProforma && (
                <Field label="Item Description">
                  <input
                    type="text"
                    className={`${inputClass} font-mono tracking-tight`}
                    value={metadata.itemName}
                    onChange={(e) =>
                      setMetadata({ ...metadata, itemName: e.target.value })
                    }
                  />
                </Field>
              )}
            </div>

            {isAddingHospital && (
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 sm:flex-row sm:items-center md:col-span-2">
                <p className="text-xs text-slate-600">
                  New hospital — fill in the name and address above, then save
                  it to reuse next time.
                </p>
                <button
                  onClick={handleSaveHospital}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <Plus className="h-3.5 w-3.5" /> Save to list
                </button>
              </div>
            )}
          </div>

          <div className="my-6 h-px bg-slate-100" />

          <SectionLabel>{isProforma ? "Date" : "Commercial terms"}</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Field
              label={
                isProforma
                  ? "Invoice date"
                  : isTender
                    ? "Tender date"
                    : "Quotation date"
              }
            >
              <input
                type="date"
                className={`${inputClass} font-mono`}
                value={metadata.date}
                onChange={(e) =>
                  setMetadata({ ...metadata, date: e.target.value })
                }
              />
            </Field>
            {!isProforma && (
              <>
                <Field label="Delivery">
                  <input
                    type="text"
                    className={inputClass}
                    value={metadata.deliveryTerms}
                    onChange={(e) =>
                      setMetadata({ ...metadata, deliveryTerms: e.target.value })
                    }
                  />
                </Field>
                <Field label="Validity">
                  <input
                    type="text"
                    className={inputClass}
                    value={metadata.validityTerms}
                    onChange={(e) =>
                      setMetadata({ ...metadata, validityTerms: e.target.value })
                    }
                  />
                </Field>
                <Field label="Payment">
                  <input
                    type="text"
                    className={inputClass}
                    value={metadata.paymentTerms}
                    onChange={(e) =>
                      setMetadata({ ...metadata, paymentTerms: e.target.value })
                    }
                  />
                </Field>
                <Field label="Warranty">
                  <input
                    type="text"
                    className={inputClass}
                    value={metadata.warranty}
                    onChange={(e) =>
                      setMetadata({ ...metadata, warranty: e.target.value })
                    }
                  />
                </Field>
              </>
            )}
          </div>
        </section>

        {/* ---------- Price schedule ---------- */}
        <section className={`overflow-hidden ${glassPanel}`}>
          <div className="flex items-center justify-between gap-3 px-6 pt-6">
            <SectionLabel>{isProforma ? "Line items" : "Price schedule"}</SectionLabel>
            <button
              onClick={addItemRow}
              className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            >
              <Plus className="h-4 w-4" /> Add item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="w-10 py-2.5 pl-6 pr-2 text-center">#</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="w-20 px-3 py-2.5 text-center">UOM</th>
                  <th className="w-24 px-3 py-2.5 text-right">Qty</th>
                  <th className="w-36 px-3 py-2.5 text-right">Unit · GH¢</th>
                  <th className="w-36 px-3 py-2.5 text-right">Total · GH¢</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="group transition hover:bg-slate-50/60"
                  >
                    <td className="py-2 pl-6 pr-2 text-center font-mono text-xs text-slate-400">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className={inputClass}
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, "description", e.target.value)
                        }
                        placeholder="Item description…"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className={`${inputClass} text-center`}
                        value={item.uom}
                        onChange={(e) =>
                          updateItem(item.id, "uom", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className={`${inputClass} text-right font-mono tabular-nums`}
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "qty",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className={`${inputClass} text-right font-mono tabular-nums`}
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            "unitPrice",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm font-semibold tabular-nums text-slate-800">
                      {money(item.qty * item.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeItemRow(item.id)}
                        disabled={items.length <= 1}
                        aria-label="Remove item"
                        className="rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                      >
                        <Trash2 className="h-4 w-4 cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- Tax + totals ---------- */}
          <div className="flex flex-col gap-8 border-t border-white/60 bg-white/40 p-6 md:flex-row md:justify-between">
            <div className="w-full md:max-w-sm">
              <SectionLabel>Tax matrix</SectionLabel>
              <div className="space-y-2.5">
                {taxes.map((tax, index) => (
                  <label
                    key={tax.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-slate-300"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      checked={tax.enabled}
                      onChange={(e) => {
                        const copy = [...taxes];
                        copy[index].enabled = e.target.checked;
                        setTaxes(copy);
                      }}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {tax.name}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <input
                        type="number"
                        className="w-14 rounded-md border border-slate-200 px-1.5 py-0.5 text-right font-mono text-xs tabular-nums focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
                        value={tax.percentage}
                        onChange={(e) => {
                          const copy = [...taxes];
                          copy[index].percentage =
                            parseFloat(e.target.value) || 0;
                          setTaxes(copy);
                        }}
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </label>
                ))}

                {/* Discount — a proforma-only deduction from the subtotal */}
                {isProforma && (
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-rose-200 bg-rose-50/40 px-3 py-2.5 shadow-sm transition hover:border-rose-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      checked={discount.enabled}
                      onChange={(e) =>
                        setDiscount({ ...discount, enabled: e.target.checked })
                      }
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Discount
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <input
                        type="number"
                        className="w-14 rounded-md border border-slate-200 px-1.5 py-0.5 text-right font-mono text-xs tabular-nums focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/15"
                        value={discount.percentage}
                        onChange={(e) =>
                          setDiscount({
                            ...discount,
                            percentage: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="w-full md:max-w-xs">
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums text-slate-800">
                    GH¢ {money(totals.subtotal)}
                  </span>
                </div>
                {taxes
                  .filter((t) => t.enabled)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-slate-500"
                    >
                      <span>
                        {t.name}{" "}
                        <span className="text-slate-400">
                          ({t.percentage}%)
                        </span>
                      </span>
                      <span className="font-mono tabular-nums text-teal-700">
                        GH¢ {money(totals.subtotal * (t.percentage / 100))}
                      </span>
                    </div>
                  ))}
                {isProforma && discount.enabled && discount.percentage > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>
                      Discount{" "}
                      <span className="text-slate-400">
                        ({discount.percentage}%)
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-rose-600">
                      − GH¢ {money(totals.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm font-semibold text-slate-900">
                    Grand total
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-slate-900">
                    GH¢ {money(totals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <p className="px-1 text-xs text-slate-400">
          Package assembles {docCount} document{docCount === 1 ? "" : "s"} (
          {docNames.join(", ")})
          {certCount > 0 &&
            ` plus ${certCount} company certificate${certCount === 1 ? "" : "s"}`}
          .
        </p>
      </main>

      {/* ---------- Sticky command bar ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Grand total · {items.length} item{items.length === 1 ? "" : "s"}
            </p>
            <p className="font-mono text-lg font-bold tabular-nums text-slate-900">
              GH¢ {money(totals.grandTotal)}
            </p>
          </div>
          <button
            onClick={handleCompilePackage}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Compiling…
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />{" "}
                {isProforma ? "Generate proforma" : "Assemble bid package"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
