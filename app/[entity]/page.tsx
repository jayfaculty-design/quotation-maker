import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  FileText,
  ReceiptText,
  Layers,
  Sparkles,
} from "lucide-react";
import { getEntity } from "@/data/entities";
import { DOC_TYPES, isDocTypeAvailable } from "@/data/documentTypes";

const GLASS =
  "border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_-14px_rgba(2,6,23,0.22)]";

const DOC_ICON: Record<string, typeof FileText> = {
  quotation: FileText,
  proforma: ReceiptText,
  tender: Layers,
};

export default async function EntityPage({
  params,
}: {
  params: Promise<{ entity: string }>;
}) {
  const { entity: slug } = await params;
  const entity = getEntity(slug);
  if (!entity) notFound();

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-slate-900">
      {/* ambient glass backdrop (entity-accented) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#eef3fb] via-[#eef2f9] to-[#e9eef7]" />
        <div
          className="animate-blob absolute -left-24 top-[-6rem] h-[26rem] w-[26rem] rounded-full blur-3xl"
          style={{ backgroundColor: `${entity.accent}26` }}
        />
        <div
          className="animate-blob absolute right-[-8rem] top-32 h-[24rem] w-[24rem] rounded-full bg-sky-300/25 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />
      </div>

      {/* top bar */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 ${GLASS}`}
        >
          <ArrowLeft className="h-4 w-4" /> All companies
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-sky-600 text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold tracking-tight">TenderSuite</span>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        {/* entity hero */}
        <section className="fade-up flex flex-col items-center pt-6 text-center sm:pt-12">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-3xl bg-white ${GLASS}`}
            style={{ boxShadow: `0 18px 50px -20px ${entity.accent}66` }}
          >
            {entity.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entity.logo}
                alt={`${entity.name} logo`}
                className="h-12 w-auto max-w-[60px] object-contain"
              />
            ) : (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
                style={{ backgroundColor: entity.accent }}
              >
                {entity.initials}
              </span>
            )}
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {entity.name}
          </h1>
          <p className="mt-2 max-w-md text-sm text-slate-500">{entity.tagline}</p>
          <span
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md"
            style={{ color: entity.accent }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: entity.accent }}
            />
            Choose a document to prepare
          </span>
        </section>

        {/* doc-type grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {DOC_TYPES.map((d, i) => {
            const available = isDocTypeAvailable(entity.slug, d.slug);
            const Icon = DOC_ICON[d.slug] ?? FileText;
            const inner = (
              <div
                className={`group relative flex h-full flex-col overflow-hidden rounded-3xl p-6 transition duration-300 ${GLASS} ${
                  available
                    ? "cursor-pointer hover:-translate-y-1.5 hover:bg-white/85"
                    : "opacity-70"
                }`}
              >
                {available && (
                  <span
                    className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                    style={{
                      boxShadow: `0 0 0 1px ${entity.accent}55, 0 24px 60px -28px ${entity.accent}66`,
                    }}
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition group-hover:scale-105"
                    style={{
                      background: available
                        ? `linear-gradient(135deg, ${entity.accent}, ${entity.accent}cc)`
                        : undefined,
                      backgroundColor: available ? undefined : "#cbd5e1",
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  {available ? (
                    <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-slate-300" />
                  )}
                </div>

                <h2 className="relative mt-5 text-lg font-bold tracking-tight text-slate-900">
                  {d.name}
                </h2>
                <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                  {d.description}
                </p>

                <span
                  className={`relative mt-6 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                    available
                      ? "text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                  style={
                    available ? { backgroundColor: entity.accent } : undefined
                  }
                >
                  {available ? "Available" : "Coming soon"}
                </span>
              </div>
            );

            return (
              <div
                key={d.slug}
                className="fade-up h-full"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                {available ? (
                  <Link
                    href={`/${entity.slug}/${d.slug}`}
                    className="block h-full"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
