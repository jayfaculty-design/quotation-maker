// src/app/page.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ENTITIES } from "@/data/entities";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f6f7f9] font-sans text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-600">
            Tender · Quotation · Proforma
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Document Preparation System
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a company to begin preparing a document.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ENTITIES.map((e) => (
            <Link
              key={e.slug}
              href={`/${e.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: e.accent }}
              >
                {e.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {e.name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {e.tagline}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
