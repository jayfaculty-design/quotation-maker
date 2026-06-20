// src/app/[entity]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Lock } from "lucide-react";
import { getEntity } from "@/data/entities";
import { DOC_TYPES } from "@/data/documentTypes";

export default async function EntityPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity: slug } = await params;
  const entity = getEntity(slug);
  if (!entity) notFound();

  return (
    <div className="min-h-screen bg-[#f6f7f9] font-sans text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All companies
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: entity.accent }}
            >
              {entity.initials}
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                {entity.name}
              </h1>
              <p className="text-xs text-slate-500">{entity.tagline}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Choose a document type
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DOC_TYPES.map((d) => {
            const available = d.status === "available";
            const card = (
              <div
                className={`flex h-full flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition ${
                  available
                    ? "group cursor-pointer border-slate-200 hover:border-teal-300 hover:shadow-md"
                    : "cursor-not-allowed border-slate-200 opacity-70"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {d.name}
                  </h2>
                  {available ? (
                    <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-slate-300" />
                  )}
                </div>
                <p className="flex-1 text-xs leading-relaxed text-slate-500">
                  {d.description}
                </p>
                <span
                  className={`mt-4 inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    available
                      ? "bg-teal-50 text-teal-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {available ? "Available" : "Coming soon"}
                </span>
              </div>
            );

            return available ? (
              <Link key={d.slug} href={`/${entity.slug}/${d.slug}`}>
                {card}
              </Link>
            ) : (
              <div key={d.slug}>{card}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
