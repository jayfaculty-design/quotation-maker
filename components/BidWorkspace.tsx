"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  FileDown,
  Loader2,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useHospitals } from "@/lib/useHospitals";
import { usePersistentState } from "@/lib/usePersistentState";

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

  // Hospital list (seed + saved) and add helper
  const { hospitals, addHospital } = useHospitals();
  const [selectedHospitalId, setSelectedHospitalId] = usePersistentState(
    "bc-bid-hospital",
    "ugmc",
  );
  const [isAddingHospital, setIsAddingHospital] = useState(false);

  // 1. Template Variables Form Setup
  const [metadata, setMetadata] = usePersistentState("bc-bid-metadata", {
    hospitalName: "UNIVERSITY OF GHANA MEDICAL CENTRE LTD",
    hospitalAddress: "P. O. BOX LG 25, LEGON- ACCRA, GHANA",
    sqNumber: "RFQ/UGMC/PU/PQ/GDS/SCRB/58/2026",
    date: "2026-05-08",
    title: "SUPPLY OF SCRUBS",
    itemName: "SCRUBS",
    deliveryTerms: "IMMEDIATELY AFTER ORDER CONFIRMATION",
    validityTerms: "90 DAYS",
    paymentTerms: "WITHIN 30 DAYS",
  });

  // 2. Excel Row Management matching your input arrays
  const [items, setItems] = usePersistentState("bc-bid-items", [
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
  ]);

  // 3. Ghanaian Tax Profile Options
  const [taxes, setTaxes] = usePersistentState("bc-bid-taxes", [
    { id: "vat", name: "VAT", percentage: 20, enabled: true },
    { id: "covid", name: "COVID-19 Levy", percentage: 0, enabled: false },
  ]);

  const [totals, setTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
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

    setTotals({
      subtotal,
      taxAmount,
      grandTotal: subtotal + taxAmount,
    });
  }, [items, taxes]);

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
      linkAnchor.download = `BID_PACKAGE_${metadata.sqNumber.replace(/\//g, "_")}.zip`;
      document.body.appendChild(linkAnchor);
      linkAnchor.click();
      linkAnchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error("❌ Document assembly fault:", error.message);
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] font-sans text-slate-900">
      {/* ---------- App header ---------- */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-bold tracking-tight text-white">
              BC
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold text-slate-900">
                Bid Package Studio
              </h1>
              <p className="text-[11px] text-slate-500">
                BC Medicals · Tender assembly
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500 sm:flex">
            <FileText className="h-3.5 w-3.5 text-teal-600" />
            {PACKAGE_DOCS.length} documents
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 pb-32 pt-7">
        {/* ---------- Tender details ---------- */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <SectionLabel>Tender details</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Hospital">
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
            <Field label="SQ number reference">
              <input
                type="text"
                className={`${inputClass} font-mono tracking-tight`}
                value={metadata.sqNumber}
                onChange={(e) =>
                  setMetadata({ ...metadata, sqNumber: e.target.value })
                }
              />
            </Field>
            <Field label="Hospital name">
              <input
                type="text"
                className={inputClass}
                value={metadata.hospitalName}
                onChange={(e) =>
                  setMetadata({ ...metadata, hospitalName: e.target.value })
                }
                placeholder={
                  isAddingHospital ? "Type the new hospital name…" : undefined
                }
              />
            </Field>
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
            <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Hospital address">
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
                      ? "Type the new hospital address…"
                      : undefined
                  }
                />
              </Field>
              <Field label="Item Name">
                <input
                  type="text"
                  className={`${inputClass} font-mono tracking-tight`}
                  value={metadata.itemName}
                  onChange={(e) =>
                    setMetadata({ ...metadata, itemName: e.target.value })
                  }
                />
              </Field>
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

          <SectionLabel>Commercial terms</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Quotation date">
              <input
                type="date"
                className={`${inputClass} font-mono`}
                value={metadata.date}
                onChange={(e) =>
                  setMetadata({ ...metadata, date: e.target.value })
                }
              />
            </Field>
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
          </div>
        </section>

        {/* ---------- Price schedule ---------- */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 px-6 pt-6">
            <SectionLabel>Price schedule</SectionLabel>
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
          <div className="flex flex-col gap-8 border-t border-slate-100 bg-slate-50/40 p-6 md:flex-row md:justify-between">
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
          Package assembles {PACKAGE_DOCS.length} documents:{" "}
          {PACKAGE_DOCS.join(", ")}.
        </p>
      </main>

      {/* ---------- Sticky command bar ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur">
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
                <FileDown className="h-4 w-4" /> Assemble bid package
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
